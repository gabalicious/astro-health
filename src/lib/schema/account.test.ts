import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { accountSchema } from './account';

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
