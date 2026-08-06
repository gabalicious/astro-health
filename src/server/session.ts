import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { deleteSession, userIdForSession } from './store';

export const SESSION_COOKIE = 'astro_health_session';

export const WEEK_SECONDS = 60 * 60 * 24 * 7;
export const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export type SessionEnv = { Variables: { userId: string } };

export function startSession(c: Context, sessionId: string, maxAge: number = WEEK_SECONDS) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge,
  });
}

/** Clears both halves of the session: the store row and the cookie. */
export function endSession(c: Context) {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) deleteSession(sessionId);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function currentUserId(c: Context): string | undefined {
  return userIdForSession(getCookie(c, SESSION_COOKIE));
}

/** Guards anything user-owned; the message is the caller's to phrase. */
export function requireSessionWith(message: string): MiddlewareHandler<SessionEnv> {
  return async (c, next) => {
    const userId = currentUserId(c);

    if (!userId) {
      return c.json({ ok: false, message, fieldErrors: {} }, 401);
    }

    c.set('userId', userId);
    await next();
  };
}

/** Guards onboarding and the profile: it has to belong to somebody. */
export const requireSession = requireSessionWith(
  'Create your account before setting up your plan.',
);
