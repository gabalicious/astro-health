import type { Plan } from '@/lib/plan';
import type { AccountDraft, LoginDraft } from '@/lib/schema/account';
import type { ProfileDraft, ProfilePayload } from '@/lib/schema/profile';

export type FieldErrors = Record<string, string[] | undefined>;

export type ApiResult =
  | { ok: true; userId: string; plan?: Plan; onboarded?: boolean }
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

/** Verifies credentials; the response's `onboarded` flag routes the redirect. */
export const submitLogin = (values: LoginDraft) => post('/api/login', values);

/** Saves edited profile answers and returns the recomputed plan. */
export const submitProfile = (values: ProfileDraft) => post('/api/profile', values);

/** Fire-and-forget; the redirect that follows is the real outcome. */
export async function submitLogout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' }).catch(() => undefined);
}

export type ProfileFetchResult =
  | { status: 'ok'; profile: ProfilePayload }
  | { status: 'no-profile' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string };

/** Loads the saved profile so the settings form can seed itself. */
export async function fetchProfile(): Promise<ProfileFetchResult> {
  let response: Response;

  try {
    response = await fetch('/api/profile');
  } catch {
    return { status: 'error', message: 'We could not reach the server.' };
  }

  if (response.status === 401) return { status: 'unauthenticated' };
  if (response.status === 404) return { status: 'no-profile' };

  const body = (await response.json().catch(() => null)) as
    | { ok: true; profile: ProfilePayload }
    | { ok: false; message?: string }
    | null;

  if (!body?.ok) {
    return { status: 'error', message: 'The server returned an unexpected response.' };
  }

  return { status: 'ok', profile: body.profile };
}
