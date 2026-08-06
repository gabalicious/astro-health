import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { loginSchema } from '@/lib/schema/account';
import { endSession, startSession, THIRTY_DAYS_SECONDS, WEEK_SECONDS } from '../session';
import { createSession, getProfile, verifyCredentials } from '../store';

export const loginRoutes = new Hono()
  .post(
    '/login',
    zValidator('json', loginSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            ok: false as const,
            message: 'Some answers need another look.',
            fieldErrors: z.flattenError(result.error).fieldErrors,
          },
          400,
        );
      }
    }),
    (c) => {
      const { email, password, rememberMe } = c.req.valid('json');
      const user = verifyCredentials(email, password);

      if (!user) {
        // Deliberately form-level, not field-scoped: never confirm which half
        // of a bad credential pair was wrong.
        return c.json(
          { ok: false as const, message: 'Wrong email or password.', fieldErrors: {} },
          401,
        );
      }

      startSession(
        c,
        createSession(user.id),
        rememberMe === 'true' ? THIRTY_DAYS_SECONDS : WEEK_SECONDS,
      );

      return c.json(
        { ok: true as const, userId: user.id, onboarded: Boolean(getProfile(user.id)) },
        200,
      );
    },
  )
  // No requireSession: clearing a session that does not exist is still success.
  .post('/logout', (c) => {
    endSession(c);
    return c.json({ ok: true as const }, 200);
  });
