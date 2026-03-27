/**
 * Test suite for validation functions
 * Run with: npx jest tests/
 */

import { Keypair } from 'stellar-sdk';

import {
  validatePaymentInstruction,
  validateBatchConfig,
  validatePaymentInstructions,
} from '../lib/stellar/validator';

const validSecretKey = Keypair.random().secret();
const validAddress = Keypair.random().publicKey();
const secondValidAddress = Keypair.random().publicKey();
const validIssuer = Keypair.random().publicKey();
const invalidChecksumAddress = `${validAddress.slice(0, -1)}${validAddress.endsWith('A') ? 'B' : 'A'}`;
const invalidChecksumIssuer = `${validIssuer.slice(0, -1)}${validIssuer.endsWith('A') ? 'B' : 'A'}`;

describe('Payment Instruction Validation', () => {
  test('validates correct XLM payment', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '100.50',
      asset: 'XLM',
    });
    expect(result.valid).toBe(true);
  });

  test('validates correct issued asset payment', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '50.25',
      asset: `USDC:${validIssuer}`,
    });
    expect(result.valid).toBe(true);
  });

  test('rejects invalid address', () => {
    const result = validatePaymentInstruction({
      address: 'INVALID_ADDRESS',
      amount: '100',
      asset: 'XLM',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('address');
  });

  test('rejects address with invalid checksum', () => {
    const result = validatePaymentInstruction({
      address: invalidChecksumAddress,
      amount: '100',
      asset: 'XLM',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('checksum');
  });

  test('rejects negative amount', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '-100',
      asset: 'XLM',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('amount');
  });

  test('rejects zero amount', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '0',
      asset: 'XLM',
    });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid asset format', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '100',
      asset: 'INVALID',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('asset');
  });

  test('rejects asset issuer with invalid checksum', () => {
    const result = validatePaymentInstruction({
      address: validAddress,
      amount: '100',
      asset: `USDC:${invalidChecksumIssuer}`,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('checksum');
  });
});

describe('Batch Configuration Validation', () => {
  test('validates correct config', () => {
    const result = validateBatchConfig({
      secretKey: validSecretKey,
      network: 'testnet',
      maxOperationsPerTransaction: 50,
    });
    expect(result.valid).toBe(true);
  });

  test('rejects invalid secret key', () => {
    const result = validateBatchConfig({
      secretKey: 'INVALID_SECRET',
      network: 'testnet',
      maxOperationsPerTransaction: 50,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('secret key');
  });

  test('rejects invalid network', () => {
    const result = validateBatchConfig({
      secretKey: validSecretKey,
      network: 'invalid' as any,
      maxOperationsPerTransaction: 50,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('network');
  });

  test('rejects excessive operations per transaction', () => {
    const result = validateBatchConfig({
      secretKey: validSecretKey,
      network: 'testnet',
      maxOperationsPerTransaction: 200,
    });
    expect(result.valid).toBe(false);
  });
});

describe('Batch Validation', () => {
  test('validates batch of correct payments', () => {
    const result = validatePaymentInstructions([
      {
        address: validAddress,
        amount: '100',
        asset: 'XLM',
      },
      {
        address: secondValidAddress,
        amount: '50',
        asset: 'XLM',
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors.size).toBe(0);
  });

  test('detects errors in batch', () => {
    const result = validatePaymentInstructions([
      {
        address: validAddress,
        amount: '100',
        asset: 'XLM',
      },
      {
        address: 'INVALID',
        amount: '50',
        asset: 'XLM',
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.size).toBe(1);
    expect(result.errors.has(1)).toBe(true);
  });
});
