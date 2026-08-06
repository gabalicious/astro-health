import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { computePlan } from '@/lib/plan';
import { profileSchema } from '@/lib/schema/profile';
import { requireSession, type SessionEnv } from '../session';
import { saveProfile } from '../store';

export const onboardingRoutes = new Hono<SessionEnv>().post(
  '/onboarding',
  // Session first: an unauthenticated caller should hear about that, not about
  // which of their measurements were malformed.
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
    console.info('[onboarding] saved profile', {
      userId,
      goal: profile.goal,
      calories: plan.calories,
    });

    return c.json({ ok: true as const, userId, plan }, 200);
  },
);
