import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { userIdForSession } from './store';

export const SESSION_COOKIE = 'astro_health_session';

export type SessionEnv = { Variables: { userId: string } };

export function startSession(c: Context, sessionId: string) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function currentUserId(c: Context): string | undefined {
  return userIdForSession(getCookie(c, SESSION_COOKIE));
}

/** Guards onboarding: the profile has to belong to somebody. */
export const requireSession: MiddlewareHandler<SessionEnv> = async (c, next) => {
  const userId = currentUserId(c);

  if (!userId) {
    return c.json(
      {
        ok: false,
        message: 'Create your account before setting up your plan.',
        fieldErrors: {},
      },
      401,
    );
  }

  c.set('userId', userId);
  await next();
};
