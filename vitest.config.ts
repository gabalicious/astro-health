import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json so tests import the same way the
    // app does. Vitest does not read tsconfig paths on its own.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Pure-logic tests only; browser flows live in e2e/ under Playwright.
    include: ['src/lib/**/*.test.ts'],
  },
});
