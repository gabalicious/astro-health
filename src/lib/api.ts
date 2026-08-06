import type { AccountDraft } from '@/lib/schema/account';
import type { ProfileDraft } from '@/lib/schema/profile';

export type FieldErrors = Record<string, string[] | undefined>;

export type ApiResult =
  | { ok: true; userId: string }
  | { ok: false; message: string; fieldErrors: FieldErrors };

async function post(path: string, body: unknown): Promise<ApiResult> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      message: 'We could not reach the server. Check your connection and try again.',
      fieldErrors: {},
    };
  }

  const result = (await response.json().catch(() => null)) as ApiResult | null;

  if (!result) {
    return { ok: false, message: 'The server returned an unexpected response.', fieldErrors: {} };
  }

  return result;
}

/** Creates the account and starts a session cookie. */
export const submitSignup = (values: AccountDraft) => post('/api/signup', values);

/** Attaches the onboarding profile to the session started at signup. */
export const submitOnboarding = (values: ProfileDraft) => post('/api/onboarding', values);
