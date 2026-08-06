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
