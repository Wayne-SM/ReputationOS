import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../auth.service.js';
import { generateSessionToken } from '../../lib/session.js';
import { registerSchema, loginSchema } from '../../lib/validation.js';

describe('Password Hashing & Verification', () => {
  it('should hash a password into a salt:key format', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toContain(':');
    const parts = hash.split(':');
    expect(parts.length).toBe(2);
    expect(parts[0]!.length).toBe(64); // 32 bytes hex
    expect(parts[1]!.length).toBe(128); // 64 bytes hex
  });

  it('should generate distinct hashes for the same password due to random salt', async () => {
    const password = 'SamePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('should verify correct password against generated hash', async () => {
    const password = 'CorrectHorseBatteryStaple123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password against generated hash', async () => {
    const password = 'OriginalPassword123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword123', hash);
    expect(isValid).toBe(false);
  });

  it('should handle malformed hashes gracefully', async () => {
    const isValid = await verifyPassword('test', 'not-a-valid-hash');
    expect(isValid).toBe(false);
  });
});

describe('Session Token Generation', () => {
  it('should generate 64-character hexadecimal tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1.length).toBe(64);
    expect(token2.length).toBe(64);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
  });
});

describe('Auth Input Validation Schemas', () => {
  it('should validate valid registration input', () => {
    const valid = {
      email: 'owner@localcafe.com',
      password: 'StrongPassword123',
      name: 'Jane Doe',
      businessName: 'Jane Cafe',
    };

    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe('owner@localcafe.com');
    expect(parsed.name).toBe('Jane Doe');
    expect(parsed.businessName).toBe('Jane Cafe');
  });

  it('should normalize email to lowercase and trim whitespace', () => {
    const input = {
      email: '  OWNER@LocalCafe.COM  ',
      password: 'StrongPassword123',
      name: '  Jane Doe  ',
      businessName: '  Jane Cafe  ',
    };

    const parsed = registerSchema.parse(input);
    expect(parsed.email).toBe('owner@localcafe.com');
    expect(parsed.name).toBe('Jane Doe');
    expect(parsed.businessName).toBe('Jane Cafe');
  });

  it('should reject short passwords less than 8 characters', () => {
    const invalid = {
      email: 'owner@localcafe.com',
      password: 'short',
      name: 'Jane Doe',
      businessName: 'Jane Cafe',
    };

    expect(() => registerSchema.parse(invalid)).toThrow();
  });

  it('should reject invalid email formats', () => {
    const invalid = {
      email: 'not-an-email',
      password: 'StrongPassword123',
      name: 'Jane Doe',
      businessName: 'Jane Cafe',
    };

    expect(() => registerSchema.parse(invalid)).toThrow();
  });

  it('should validate login input', () => {
    const valid = {
      email: 'User@Example.COM',
      password: 'anypassword',
    };

    const parsed = loginSchema.parse(valid);
    expect(parsed.email).toBe('user@example.com');
  });
});
