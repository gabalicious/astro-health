import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-logic tests only; browser flows live in e2e/ under Playwright.
    include: ['src/lib/**/*.test.ts'],
  },
});
