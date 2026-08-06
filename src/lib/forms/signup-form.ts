import { type AccountDraft, accountDefaults, accountFieldSchemas } from '@/lib/schema/account';
import type { WizardConfig } from './types';

/**
 * A single-step config. The renderer drops its step chrome when there is only
 * one step, so the same engine covers both this and the onboarding wizard.
 */
export const signupForm: WizardConfig<AccountDraft> = {
  id: 'signup',
  defaults: accountDefaults,
  steps: [
    {
      id: 'account',
      title: 'Create your account',
      description: 'This is how you get back in. Setup comes next.',
      fields: [
        {
          name: 'email',
          kind: 'email',
          label: 'Email',
          placeholder: 'you@example.com',
          autocomplete: 'email',
          schema: accountFieldSchemas.email,
        },
        {
          name: 'password',
          kind: 'password',
          label: 'Password',
          hint: 'At least 8 characters.',
          autocomplete: 'new-password',
          schema: accountFieldSchemas.password,
        },
      ],
    },
  ],
};
