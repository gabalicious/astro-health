import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { fieldErrorsFromIssues } from '@/lib/schema/errors';
import { workoutSchema } from '@/lib/schema/workout';
import { summariseWorkout } from '@/lib/workout';
import { requireSessionWith, type SessionEnv } from '../session';
import { addWorkout, listWorkouts } from '../store';

const requireLogin = requireSessionWith('Log in to record a workout.');

export const workoutRoutes = new Hono<SessionEnv>()
  .get('/workouts', requireLogin, (c) => {
    return c.json({ ok: true as const, workouts: listWorkouts(c.get('userId')) }, 200);
  })
  .post(
    '/workouts',
    requireLogin,
    zValidator('json', workoutSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            ok: false as const,
            message: 'Some answers need another look.',
            // Not flattenError: a bad set has to land on `sets[1].reps`, and
            // flattening would file every row error under `sets`.
            fieldErrors: fieldErrorsFromIssues(result.error),
          },
          400,
        );
      }
    }),
    (c) => {
      const userId = c.get('userId');
      const payload = c.req.valid('json');
      const workout = addWorkout(userId, payload);

      console.info('[workouts] logged', {
        userId,
        exerciseId: workout.exerciseId,
        ...summariseWorkout(payload),
      });

      return c.json({ ok: true as const, userId, workout }, 201);
    },
  );
