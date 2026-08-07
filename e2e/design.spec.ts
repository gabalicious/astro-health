import { expect, test } from '@playwright/test';

/**
 * Smoke over the design gallery: it needs no account, so these are the fastest
 * specs in the suite. The volume assertion doubles as an honesty check that the
 * demo data really goes through the workout engine.
 */

const FRAMEWORKS = ['vue', 'svelte'] as const;

for (const framework of FRAMEWORKS) {
  test(`${framework}: gallery shows tokens, validation and dark mode`, async ({ page }) => {
    await page.goto(`/design/${framework}`);
    await page.waitForSelector('astro-island:not([ssr])');

    await expect(page.locator('[data-token="primary"]')).toBeVisible();

    const root = page.getByTestId('gallery-root');
    const darkToggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await darkToggle.click();
    await expect(root).toHaveClass(/dark/);
    await darkToggle.click();
    await expect(root).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Show validation' }).click();
    await expect(page.getByText('Enter your name.')).toBeVisible();
    await page.getByRole('button', { name: 'Hide validation' }).click();

    await expect(page.getByTestId('plan-calories')).toBeVisible();
    await expect(page.getByTestId('workout-volume')).toHaveText('1640 kg');
  });
}
