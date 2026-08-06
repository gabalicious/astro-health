import { expect, type Page, test } from '@playwright/test';

/**
 * The repeater flows. The interesting one is `removes the middle row without
 * shifting the others' values`: TanStack addresses rows by index, so a removal
 * renames every row after it. That is the thing worth proving per framework
 * rather than assuming.
 */

const FRAMEWORKS = ['vue', 'svelte'] as const;
type Framework = (typeof FRAMEWORKS)[number];

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const PASSWORD = 'correcthorse';

async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('astro-island:not([ssr])');
}

/** An account is all a workout needs — no profile required. */
async function signUp(page: Page, framework: Framework) {
  await gotoHydrated(page, `/signup/${framework}`);
  await page.locator('#email').fill(uniqueEmail());
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(`/onboarding/${framework}`);
}

async function openLogger(page: Page, framework: Framework) {
  await signUp(page, framework);
  await gotoHydrated(page, `/workouts/${framework}`);
  await expect(page.locator('#exerciseId')).toBeVisible();
}

async function pickExercise(page: Page, name: string) {
  await page.locator('#exerciseId').click();
  await page.getByRole('option', { name, exact: true }).click();
}

const repsInputs = (page: Page) => page.locator('input[id^="sets["][id$=".reps"]');

for (const framework of FRAMEWORKS) {
  test(`${framework}: logs a session and reports its volume`, async ({ page }) => {
    await openLogger(page, framework);
    await pickExercise(page, 'Barbell Back Squat');

    await page.locator('#sets\\[0\\]\\.reps').fill('5');
    await page.locator('#sets\\[0\\]\\.weightKg').fill('100');
    await page.getByRole('button', { name: 'Save workout' }).click();

    await expect(page.getByTestId('workout-volume')).toHaveText('500 kg');
    await expect(page.getByTestId('workout-sets')).toHaveText('1');
  });

  test(`${framework}: adds rows and sums every one of them`, async ({ page }) => {
    await openLogger(page, framework);
    await pickExercise(page, 'Barbell Back Squat');

    await page.getByRole('button', { name: 'Add set' }).click();
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(repsInputs(page)).toHaveCount(3);

    for (const [index, reps] of ['5', '5', '8'].entries()) {
      await page.locator(`#sets\\[${index}\\]\\.reps`).fill(reps);
      await page.locator(`#sets\\[${index}\\]\\.weightKg`).fill(index === 2 ? '80' : '100');
    }

    await page.getByRole('button', { name: 'Save workout' }).click();
    // 5×100 + 5×100 + 8×80 = 1640
    await expect(page.getByTestId('workout-volume')).toHaveText('1640 kg');
  });

  test(`${framework}: removes the middle row without shifting the others' values`, async ({
    page,
  }) => {
    await openLogger(page, framework);
    await pickExercise(page, 'Barbell Back Squat');

    await page.getByRole('button', { name: 'Add set' }).click();
    await page.getByRole('button', { name: 'Add set' }).click();

    for (const [index, reps] of ['10', '20', '30'].entries()) {
      await page.locator(`#sets\\[${index}\\]\\.reps`).fill(reps);
      await page.locator(`#sets\\[${index}\\]\\.weightKg`).fill('50');
    }

    // Drop the middle row; rows 0 and 2 must survive as 10 and 30.
    await page.getByRole('button', { name: 'Remove' }).nth(1).click();

    await expect(repsInputs(page)).toHaveCount(2);
    await expect(page.locator('#sets\\[0\\]\\.reps')).toHaveValue('10');
    await expect(page.locator('#sets\\[1\\]\\.reps')).toHaveValue('30');

    // And the surviving values are what actually gets submitted.
    await page.getByRole('button', { name: 'Save workout' }).click();
    // (10 + 30) × 50 = 2000
    await expect(page.getByTestId('workout-volume')).toHaveText('2000 kg');
  });

  test(`${framework}: blames the row that is actually wrong`, async ({ page }) => {
    await openLogger(page, framework);
    await pickExercise(page, 'Barbell Back Squat');

    await page.getByRole('button', { name: 'Add set' }).click();
    await page.locator('#sets\\[0\\]\\.reps').fill('5');
    await page.locator('#sets\\[0\\]\\.weightKg').fill('100');
    // Row 1 left blank.
    await page.getByRole('button', { name: 'Save workout' }).click();

    await expect(page.getByText('Reps is required.')).toBeVisible();
    // Still on the form, and row 0 is untouched by the complaint.
    await expect(page.locator('#sets\\[0\\]\\.reps')).toHaveValue('5');
    await expect(page.getByTestId('workout-volume')).toHaveCount(0);
  });

  test(`${framework}: the last row cannot be removed`, async ({ page }) => {
    await openLogger(page, framework);
    await expect(repsInputs(page)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  test(`${framework}: logging requires an account`, async ({ page }) => {
    await page.goto(`/workouts/${framework}`);
    await expect(page).toHaveURL(`/login/${framework}`);
  });

  test(`${framework}: a saved session shows up in recent sessions`, async ({ page }) => {
    await openLogger(page, framework);
    await pickExercise(page, 'Pull-Up');

    await page.locator('#sets\\[0\\]\\.reps').fill('12');
    await page.locator('#sets\\[0\\]\\.weightKg').fill('0');
    await page.getByRole('button', { name: 'Save workout' }).click();
    await expect(page.getByTestId('workout-volume')).toBeVisible();

    await page.getByRole('link', { name: 'Log another' }).click();
    await page.waitForSelector('astro-island:not([ssr])');

    const recent = page.getByRole('listitem').filter({ hasText: 'Pull-Up' });
    await expect(recent).toHaveCount(1);
    await expect(recent).toContainText(/1\s+sets/);
  });
}
