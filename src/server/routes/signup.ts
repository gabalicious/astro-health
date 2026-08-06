import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { accountSchema } from '@/lib/schema/account';
import { startSession } from '../session';
import { createSession, createUser, findUserByEmail } from '../store';

export const signupRoutes = new Hono().post(
  '/signup',
  zValidator('json', accountSchema, (result, c) => {
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
    // The password is validated but not yet stored; hashing lands with the database.
    const { email } = c.req.valid('json');

    if (findUserByEmail(email)) {
      return c.json(
        {
          ok: false as const,
          message: 'That email already has an account.',
          fieldErrors: { email: ['That email is already registered.'] },
        },
        409,
      );
    }

    const user = createUser(email);
    startSession(c, createSession(user.id));

    return c.json({ ok: true as const, userId: user.id }, 201);
  },
);
