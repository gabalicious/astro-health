import { type LoginDraft, loginDefaults, loginFieldSchemas } from '@/lib/schema/account';
import type { WizardConfig } from './types';

/** Single-step, like signup — the engine drops the step chrome automatically. */
export const loginForm: WizardConfig<LoginDraft> = {
  id: 'login',
  defaults: loginDefaults,
  steps: [
    {
      id: 'credentials',
      title: 'Welcome back',
      description: 'Log in to see or adjust your plan.',
      fields: [
        {
          name: 'email',
          kind: 'email',
          label: 'Email',
          placeholder: 'you@example.com',
          autocomplete: 'email',
          schema: loginFieldSchemas.email,
        },
        {
          name: 'password',
          kind: 'password',
          label: 'Password',
          autocomplete: 'current-password',
          schema: loginFieldSchemas.password,
        },
        {
          name: 'rememberMe',
          kind: 'checkbox',
          label: 'Remember me',
          hint: 'Stay logged in for 30 days on this device.',
          schema: loginFieldSchemas.rememberMe,
        },
      ],
    },
  ],
};
