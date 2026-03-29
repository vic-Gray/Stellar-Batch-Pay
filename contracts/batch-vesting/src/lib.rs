#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Symbol, Vec};

const MAX_BATCH_SIZE: u32 = 100;
const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 7 * DAY_IN_LEDGERS;
const BUMP_EXTEND_TO: u32 = 30 * DAY_IN_LEDGERS;

#[contract]
pub struct BatchVestingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VestingData {
    pub amount: i128,
    pub unlock_time: u64,
    pub sender: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RevokeRequest {
    pub recipient: Address,
    pub index: u32,
}

#[contracttype]
pub enum DataKey {
    Vesting(Address, u32), // (recipient, index) — granular per-schedule key
    VestingCount(Address), // total number of schedules for a recipient
    Admin,
    PendingAdmin,
    Paused,
}

#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VestingError {
    Paused = 1,
    NotFound = 2,
    LengthMismatch = 3,
    InvalidUnlockTime = 4,
    InvalidAmount = 5,
    AdminAlreadySet = 6,
    NotAdmin = 7,
    AlreadyVested = 8,
    Unauthorized = 9,
    StillLocked = 10,
}

impl BatchVestingContract {
    fn panic_if_batch_too_large(batch_len: u32) {
        if batch_len > MAX_BATCH_SIZE {
            panic!("Batch size exceeds MAX_BATCH_SIZE");
        }
    }

    fn get_admin(env: &Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Admin)
    }

    fn set_admin_internal(env: &Env, admin: &Address) {
        env.storage().persistent().set(&DataKey::Admin, admin);
    }

    fn remove_admin_internal(env: &Env) {
        env.storage().persistent().remove(&DataKey::Admin);
    }

    fn get_pending_admin(env: &Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::PendingAdmin)
    }

    fn set_pending_admin_internal(env: &Env, admin: &Address) {
        env.storage()
            .persistent()
            .set(&DataKey::PendingAdmin, admin);
    }

    fn remove_pending_admin_internal(env: &Env) {
        env.storage().persistent().remove(&DataKey::PendingAdmin);
    }

    fn require_current_admin(env: &Env, admin: &Address) {
        admin.require_auth();
        let stored_admin = Self::get_admin(env).expect("Admin must be set");
        if admin != &stored_admin {
            panic!("Only admin can perform this action");
        }
    }

    fn is_authorized(env: &Env, caller: &Address, schedule_sender: &Address) -> bool {
        let is_sender = caller == schedule_sender;
        let is_admin = match Self::get_admin(env) {
            Some(a) => caller == &a,
            None => false,
        };
        is_sender || is_admin
    }

    fn is_paused(env: &Env) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    fn panic_if_paused(env: &Env) {
        if Self::is_paused(env) {
            soroban_sdk::panic_with_error!(env, VestingError::Paused);
        }
    }

    /// Returns the current schedule count for a recipient.
    fn get_count(env: &Env, recipient: &Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::VestingCount(recipient.clone()))
            .unwrap_or(0u32)
    }

    /// Appends a new vesting schedule for a recipient and returns its index.
    fn push_vesting(env: &Env, recipient: &Address, data: &VestingData) -> u32 {
        let idx = Self::get_count(env, recipient);
        env.storage()
            .persistent()
            .set(&DataKey::Vesting(recipient.clone(), idx), data);
        env.storage()
            .persistent()
            .set(&DataKey::VestingCount(recipient.clone()), &(idx + 1));
        idx
    }

    /// Reads a single vesting schedule by index. Panics if missing.
    fn get_vesting(env: &Env, recipient: &Address, idx: u32) -> VestingData {
        env.storage()
            .persistent()
            .get(&DataKey::Vesting(recipient.clone(), idx))
            .unwrap_or_else(|| soroban_sdk::panic_with_error!(env, VestingError::NotFound))
    }

    /// Removes a schedule by swapping it with the last entry (O(1) removal).
    fn remove_vesting(env: &Env, recipient: &Address, idx: u32) {
        let count = Self::get_count(env, recipient);
        let last = count - 1;
        if idx != last {
            // Move last entry into the removed slot
            let last_data = Self::get_vesting(env, recipient, last);
            env.storage()
                .persistent()
                .set(&DataKey::Vesting(recipient.clone(), idx), &last_data);
            Self::extend_ttl_vesting(env, recipient, idx);
        }
        env.storage()
            .persistent()
            .remove(&DataKey::Vesting(recipient.clone(), last));
        if last == 0 {
            env.storage()
                .persistent()
                .remove(&DataKey::VestingCount(recipient.clone()));
        } else {
            env.storage()
                .persistent()
                .set(&DataKey::VestingCount(recipient.clone()), &last);
        }
    }

    fn extend_ttl_admin(env: &Env) {
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Admin, BUMP_THRESHOLD, BUMP_EXTEND_TO);
        if env.storage().persistent().has(&DataKey::PendingAdmin) {
            env.storage()
                .persistent()
                .extend_ttl(&DataKey::PendingAdmin, BUMP_THRESHOLD, BUMP_EXTEND_TO);
        }
    }

    fn extend_ttl_paused(env: &Env) {
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Paused, BUMP_THRESHOLD, BUMP_EXTEND_TO);
    }

    fn extend_ttl_vesting(env: &Env, recipient: &Address, idx: u32) {
        env.storage().persistent().extend_ttl(
            &DataKey::Vesting(recipient.clone(), idx),
            BUMP_THRESHOLD,
            BUMP_EXTEND_TO,
        );
        env.storage().persistent().extend_ttl(
            &DataKey::VestingCount(recipient.clone()),
            BUMP_THRESHOLD,
            BUMP_EXTEND_TO,
        );
    }
}

#[contractimpl]
impl BatchVestingContract {
    /// Initialize a batch of vestings.
    pub fn deposit(
        env: Env,
        sender: Address,
        token: Address,
        recipients: Vec<Address>,
        amounts: Vec<i128>,
        unlock_time: u64,
    ) {
        Self::panic_if_paused(&env);
        sender.require_auth();

        if recipients.len() != amounts.len() {
            soroban_sdk::panic_with_error!(&env, VestingError::LengthMismatch);
        }

        Self::panic_if_batch_too_large(recipients.len());

        if unlock_time <= env.ledger().timestamp() {
            soroban_sdk::panic_with_error!(&env, VestingError::InvalidUnlockTime);
        }

        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();
            let amount = amounts.get(i).unwrap();

            if amount <= 0 {
                soroban_sdk::panic_with_error!(&env, VestingError::InvalidAmount);
            }

            total_amount = total_amount.checked_add(amount).unwrap();

            let idx = Self::push_vesting(
                &env,
                &recipient,
                &VestingData {
                    amount,
                    unlock_time,
                    sender: sender.clone(),
                },
            );
            Self::extend_ttl_vesting(&env, &recipient, idx);

            env.events().publish(
                (Symbol::new(&env, "VestingDeposited"), sender.clone(), recipient),
                (amount, unlock_time),
            );
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);
    }

    /// Set admin for the contract. Only the first call can set the admin.
    pub fn set_admin(env: Env, admin: Address) {
        admin.require_auth();
        if Self::get_admin(&env).is_some() {
            soroban_sdk::panic_with_error!(&env, VestingError::AdminAlreadySet);
        }
        Self::set_admin_internal(&env, &admin);
        Self::extend_ttl_admin(&env);
    }

    /// Propose a new admin. Only the current admin can nominate a successor.
    pub fn propose_admin(env: Env, admin: Address, new_admin: Address) {
        Self::panic_if_paused(&env);
        Self::require_current_admin(&env, &admin);
        Self::set_pending_admin_internal(&env, &new_admin);
        Self::extend_ttl_admin(&env);
        env.events().publish(
            (Symbol::new(&env, "AdminTransferProposed"),),
            (admin, new_admin),
        );
    }

    /// Accept a pending admin transfer.
    pub fn accept_admin(env: Env, new_admin: Address) {
        new_admin.require_auth();
        let pending_admin = Self::get_pending_admin(&env).expect("No admin transfer proposed");
        if new_admin != pending_admin {
            panic!("Only pending admin can accept transfer");
        }

        let previous_admin = Self::get_admin(&env).expect("Admin must be set");
        Self::set_admin_internal(&env, &new_admin);
        Self::remove_pending_admin_internal(&env);
        Self::extend_ttl_admin(&env);

        env.events().publish(
            (Symbol::new(&env, "AdminTransferred"),),
            (previous_admin, new_admin),
        );
    }

    /// Directly transfer admin to a new address. Requires authorization from the current admin.
    pub fn transfer_admin(env: Env, admin: Address, new_admin: Address) {
        Self::panic_if_paused(&env);
        Self::require_current_admin(&env, &admin);
        Self::set_admin_internal(&env, &new_admin);
        Self::remove_pending_admin_internal(&env);
        Self::extend_ttl_admin(&env);

        env.events().publish(
            (Symbol::new(&env, "AdminTransferred"),),
            (admin, new_admin),
        );
    }

    /// Renounce admin rights and clear any in-flight transfer.
    pub fn renounce_admin(env: Env, admin: Address) {
        Self::panic_if_paused(&env);
        Self::require_current_admin(&env, &admin);
        Self::remove_admin_internal(&env);
        Self::remove_pending_admin_internal(&env);

        env.events()
            .publish((Symbol::new(&env, "AdminRenounced"),), admin);
    }

    /// Toggle contract pause state. Only admin can toggle pause.
    pub fn toggle_pause(env: Env, admin: Address, paused: bool) {
        Self::require_current_admin(&env, &admin);
        env.storage().persistent().set(&DataKey::Paused, &paused);
        Self::extend_ttl_paused(&env);

        env.events()
            .publish((Symbol::new(&env, "PauseToggled"),), (admin, paused));
    }

    /// Revoke unvested schedule by recipient/unlock time.
    pub fn revoke(env: Env, caller: Address, recipient: Address, token: Address, index: u32) {
        Self::panic_if_paused(&env);
        caller.require_auth();

        let count = Self::get_count(&env, &recipient);
        if index >= count {
            soroban_sdk::panic_with_error!(&env, VestingError::NotFound);
        }

        let vesting = Self::get_vesting(&env, &recipient, index);
        let current_time = env.ledger().timestamp();
        let unlock_time = vesting.unlock_time;

        if current_time >= unlock_time {
            soroban_sdk::panic_with_error!(&env, VestingError::AlreadyVested);
        }

        if !Self::is_authorized(&env, &caller, &vesting.sender) {
            soroban_sdk::panic_with_error!(&env, VestingError::Unauthorized);
        }

        let revoked_amount = vesting.amount;
        let sender = vesting.sender.clone();

        Self::remove_vesting(&env, &recipient, index);

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &sender, &revoked_amount);

        env.events().publish(
            (Symbol::new(&env, "VestingRevoked"), recipient, sender),
            (revoked_amount, unlock_time),
        );
    }

    /// Revoke unvested schedules for multiple recipients.
    /// Takes a vector of (recipient, index) pairs.
    pub fn batch_revoke(
        env: Env,
        caller: Address,
        requests: Vec<RevokeRequest>,
        token: Address,
    ) -> Vec<bool> {
        Self::panic_if_paused(&env);
        caller.require_auth();
        Self::panic_if_batch_too_large(requests.len());

        let current_time = env.ledger().timestamp();
        let mut results = Vec::new(&env);

        for i in 0..requests.len() {
            let request = requests.get(i).unwrap();
            let recipient = &request.recipient;
            let index = request.index;

            let count = Self::get_count(&env, recipient);
            if index >= count {
                results.push_back(false);
                continue;
            }

            let vesting = Self::get_vesting(&env, recipient, index);
            if current_time >= vesting.unlock_time {
                results.push_back(false);
                continue;
            }

            if !Self::is_authorized(&env, &caller, &vesting.sender) {
                results.push_back(false);
                continue;
            }

            let revoked_amount = vesting.amount;
            let sender = vesting.sender.clone();
            let unlock_time = vesting.unlock_time;

            Self::remove_vesting(&env, recipient, index);

            let token_client = token::Client::new(&env, &token);
            token_client.transfer(&env.current_contract_address(), &sender, &revoked_amount);

            env.events().publish(
                (Symbol::new(&env, "VestingRevoked"), recipient.clone(), sender),
                (revoked_amount, unlock_time),
            );
            results.push_back(true);
        }
        results
    }

    /// Return the contract version string.
    pub fn version(env: Env) -> String {
        String::from_str(&env, "1.0.0")
    }

    /// Claim the vested funds.
    pub fn claim(env: Env, recipient: Address, token: Address) {
        Self::panic_if_paused(&env);
        recipient.require_auth();

        let count = Self::get_count(&env, &recipient);
        if count == 0 {
            soroban_sdk::panic_with_error!(&env, VestingError::NotFound);
        }

        let current_time = env.ledger().timestamp();
        let mut amount_to_transfer: i128 = 0;

        // Collect claimable indices first (iterate in reverse to safely remove via swap)
        let mut claimable: Vec<u32> = Vec::new(&env);
        for i in 0..count {
            let vesting = Self::get_vesting(&env, &recipient, i);
            if current_time >= vesting.unlock_time {
                amount_to_transfer = amount_to_transfer.checked_add(vesting.amount).unwrap();
                claimable.push_back(i);
            } else {
                Self::extend_ttl_vesting(&env, &recipient, i);
            }
        }

        if amount_to_transfer == 0 {
            soroban_sdk::panic_with_error!(&env, VestingError::StillLocked);
        }

        // Remove claimable entries in reverse index order to keep swap-removal consistent
        let claimable_len = claimable.len();
        for k in (0..claimable_len).rev() {
            let idx = claimable.get(k).unwrap();
            // Re-read current count since it shrinks with each removal
            let current_count = Self::get_count(&env, &recipient);
            // The swap-remove may have moved a previously-unvisited entry into `idx`.
            // Since we collected indices before any removal and iterate in reverse,
            // indices >= current removal point are still valid.
            if idx < current_count {
                Self::remove_vesting(&env, &recipient, idx);
            }
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &amount_to_transfer,
        );

        env.events().publish(
            (Symbol::new(&env, "VestingClaimed"), recipient),
            (amount_to_transfer,),
        );
    }
}
mod test;
