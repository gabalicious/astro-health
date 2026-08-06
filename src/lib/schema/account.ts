import { z } from 'zod';

/** Everything needed to create the account itself. Nothing else. */
export const accountFieldSchemas = {
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200, 'That password is too long.'),
} as const;

export const accountSchema = z.object({
  email: accountFieldSchemas.email,
  password: accountFieldSchemas.password,
});

export type AccountPayload = z.output<typeof accountSchema>;

export type AccountDraft = {
  email: string;
  password: string;
};

export const accountDefaults: AccountDraft = {
  email: '',
  password: '',
};

/**
 * Login is deliberately looser than signup: the password only has to exist.
 * Enforcing the signup rules here would leak which half of a bad credential
 * pair was wrong.
 */
export const loginFieldSchemas = {
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  // Checkbox convention: drafts are all-string, so checked is 'true', not true.
  rememberMe: z.union([z.literal(''), z.literal('true')]),
} as const;

export const loginSchema = z.object({
  email: loginFieldSchemas.email,
  password: loginFieldSchemas.password,
  rememberMe: loginFieldSchemas.rememberMe.optional().default(''),
});

export type LoginDraft = {
  email: string;
  password: string;
  rememberMe: '' | 'true';
};

export const loginDefaults: LoginDraft = {
  email: '',
  password: '',
  rememberMe: '',
};
