export interface VestingClaimedEventPayload {
  amount: string;
  token: string;
  memo: string;
}

function toAmountString(value: unknown): string {
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error("Invalid claim amount in VestingClaimed payload.");
}

function toTokenAddress(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error("Missing token address in VestingClaimed payload.");
}

export function parseVestingClaimedPayload(payload: unknown): VestingClaimedEventPayload {
  if (!Array.isArray(payload) || payload.length < 2) {
    throw new Error("Invalid VestingClaimed payload format.");
  }

  return {
    amount: toAmountString(payload[0]),
    token: toTokenAddress(payload[1]),
    memo: typeof payload[2] === "string" ? payload[2] : "",
  };
}
