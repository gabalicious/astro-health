import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { computePlan } from '@/lib/plan';
import { profileSchema } from '@/lib/schema/profile';
import { requireSession, type SessionEnv } from '../session';
import { getProfile, saveProfile } from '../store';

export const profileRoutes = new Hono<SessionEnv>()
  .get('/profile', requireSession, (c) => {
    const profile = getProfile(c.get('userId'));

    if (!profile) {
      return c.json(
        { ok: false as const, message: 'Set up your plan first.', fieldErrors: {} },
        404,
      );
    }

    return c.json({ ok: true as const, profile }, 200);
  })
  .post(
    '/profile',
    requireSession,
    zValidator('json', profileSchema, (result, c) => {
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
      const userId = c.get('userId');
      const profile = c.req.valid('json');
      const plan = computePlan(profile);

      saveProfile(userId, profile);
      console.info('[profile] updated', { userId, goal: profile.goal, calories: plan.calories });

      return c.json({ ok: true as const, userId, plan }, 200);
    },
  );
