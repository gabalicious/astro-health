import { Hono } from 'hono';
import { loginRoutes } from './routes/login';
import { onboardingRoutes } from './routes/onboarding';
import { profileRoutes } from './routes/profile';
import { signupRoutes } from './routes/signup';
import { currentUserId } from './session';
import { getProfile } from './store';

/**
 * Astro forwards the original request URL untouched, so the Hono app has to own
 * the `/api` prefix itself.
 */
export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ ok: true }))
  .get('/me', (c) => {
    const userId = currentUserId(c);
    if (!userId) return c.json({ signedIn: false as const }, 200);
    return c.json({ signedIn: true as const, userId, onboarded: Boolean(getProfile(userId)) }, 200);
  })
  .route('/', signupRoutes)
  .route('/', loginRoutes)
  .route('/', onboardingRoutes)
  .route('/', profileRoutes);

app.notFound((c) => c.json({ ok: false, message: 'Not found' }, 404));

app.onError((error, c) => {
  console.error('[api] unhandled error', error);
  return c.json({ ok: false, message: 'Something went wrong on our end.' }, 500);
});

export type AppType = typeof app;
