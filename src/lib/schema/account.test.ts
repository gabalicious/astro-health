import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { accountSchema, loginSchema } from './account';

const errorsOf = (result: { error?: z.ZodError }): Record<string, string[] | undefined> =>
  result.error ? z.flattenError(result.error).fieldErrors : {};

describe('accountSchema', () => {
  it('parses a valid account', () => {
    const result = accountSchema.safeParse({ email: 'jo@example.com', password: 'correcthorse' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ email: 'jo@example.com', password: 'correcthorse' });
  });

  it('rejects an invalid email', () => {
    const result = accountSchema.safeParse({ email: 'not-an-email', password: 'correcthorse' });
    expect(result.success).toBe(false);
    expect(errorsOf(result).email).toEqual(['Enter a valid email address.']);
  });

  it('rejects a short password', () => {
    const result = accountSchema.safeParse({ email: 'jo@example.com', password: 'short12' });
    expect(result.success).toBe(false);
    expect(errorsOf(result).password).toEqual(['Use at least 8 characters.']);
  });
});

describe('loginSchema', () => {
  it('parses credentials with and without remember me', () => {
    expect(
      loginSchema.safeParse({ email: 'jo@example.com', password: 'pw', rememberMe: '' }).success,
    ).toBe(true);
    expect(
      loginSchema.parse({ email: 'jo@example.com', password: 'pw', rememberMe: 'true' }).rememberMe,
    ).toBe('true');
  });

  it('defaults rememberMe when absent', () => {
    const result = loginSchema.parse({ email: 'jo@example.com', password: 'pw' });
    expect(result.rememberMe).toBe('');
  });

  it('rejects a non-canonical rememberMe value', () => {
    const result = loginSchema.safeParse({
      email: 'jo@example.com',
      password: 'pw',
      rememberMe: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('rejects bad email and empty password', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: '', rememberMe: '' });
    const errors = errorsOf(result);
    expect(errors.email).toEqual(['Enter a valid email address.']);
    expect(errors.password).toEqual(['Enter your password.']);
  });

  it('is looser than signup on purpose: a 2-char password logs in but cannot sign up', () => {
    expect(
      loginSchema.safeParse({ email: 'jo@example.com', password: 'ab', rememberMe: '' }).success,
    ).toBe(true);
    expect(accountSchema.safeParse({ email: 'jo@example.com', password: 'ab' }).success).toBe(
      false,
    );
  });
});
