import { expect, type Page, test } from '@playwright/test';

/**
 * Full-flow and regression coverage for both framework implementations. The
 * store is in-memory, so unique emails keep runs independent without cleanup.
 */

const FRAMEWORKS = ['vue', 'svelte'] as const;
type Framework = (typeof FRAMEWORKS)[number];
type Units = 'metric' | 'imperial';

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

/** Astro islands drop their `ssr` attribute once hydrated; clicking earlier is a no-op. */
async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('astro-island:not([ssr])');
}

async function signUp(page: Page, framework: Framework, email: string) {
  await gotoHydrated(page, `/signup/${framework}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('correcthorse');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(`/onboarding/${framework}`);
}

async function chooseCard(page: Page, label: string) {
  await page.getByText(label, { exact: true }).click();
}

async function continueTo(page: Page, heading: string) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
}

async function fillStats(page: Page, units: Units) {
  if (units === 'imperial') {
    await chooseCard(page, 'Imperial (ft, lb)');
    await page.locator('#heightFt').fill('5');
    await page.locator('#heightIn').fill('11');
    await page.locator('#weightLb').fill('194');
    await page.locator('#targetWeightLb').fill('175');
  } else {
    await page.locator('#heightCm').fill('180');
    await page.locator('#weightKg').fill('88');
    await page.locator('#targetWeightKg').fill('79');
  }
  await chooseCard(page, '0.5 kg · about 1 lb per week');
  await page.locator('#age').fill('34');
  await page.locator('#sex').click();
  await page.getByRole('option', { name: 'Male', exact: true }).click();
}

for (const framework of FRAMEWORKS) {
  for (const units of ['metric', 'imperial'] as Units[]) {
    test(`${framework} / ${units}: full signup and onboarding shows the plan`, async ({ page }) => {
      await signUp(page, framework, uniqueEmail());

      await expect(page.getByRole('heading', { name: 'What are you here for?' })).toBeVisible();
      await chooseCard(page, 'Lose weight');
      await continueTo(page, 'A few numbers about you');

      // The conditional fields exist because the goal asked for them.
      await expect(page.getByText('Target weight')).toBeVisible();
      await expect(page.getByText('Weekly rate')).toBeVisible();

      await fillStats(page, units);
      await continueTo(page, 'How active is a normal week?');
      await chooseCard(page, 'Moderately active');
      await page.getByRole('button', { name: 'Finish setup' }).click();

      const calories = page.getByTestId('plan-calories');
      await expect(calories).toBeVisible();
      await expect(calories).toHaveText(/^[\d,]+$/);
      for (const macro of ['Protein', 'Fat', 'Carbs']) {
        await expect(page.getByText(macro, { exact: true })).toBeVisible();
      }
      // Same body in either unit system -> same canonical plan and timeline.
      // \s+ because Svelte keeps template newlines in text nodes; `.` will not cross them.
      await expect(page.getByText(/About\s+[\d.]+\s+weeks\s+to\s+[\d.]+\s+kg/)).toBeVisible();
    });
  }

  test(`${framework}: fixing a failed submit works with a single click`, async ({ page }) => {
    await signUp(page, framework, uniqueEmail());
    await chooseCard(page, 'Lose weight');
    await continueTo(page, 'A few numbers about you');

    // Fail the step wholesale, then fix everything and advance with ONE click.
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Height is required.')).toBeVisible();

    await fillStats(page, 'metric');
    await continueTo(page, 'How active is a normal week?');
  });

  test(`${framework}: onboarding without an account is rejected`, async ({ page }) => {
    await gotoHydrated(page, `/onboarding/${framework}`);
    await chooseCard(page, 'Maintain weight');
    await continueTo(page, 'A few numbers about you');
    await page.locator('#heightCm').fill('180');
    await page.locator('#weightKg').fill('88');
    await page.locator('#age').fill('34');
    await page.locator('#sex').click();
    await page.getByRole('option', { name: 'Male', exact: true }).click();
    await continueTo(page, 'How active is a normal week?');
    await chooseCard(page, 'Moderately active');
    await page.getByRole('button', { name: 'Finish setup' }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Create your account before setting up your plan.',
    );
  });

  test(`${framework}: duplicate email surfaces on the email field`, async ({ page, browser }) => {
    const email = uniqueEmail();
    await signUp(page, framework, email);

    const second = await (await browser.newContext()).newPage();
    await gotoHydrated(second, `/signup/${framework}`);
    await second.locator('#email').fill(email);
    await second.locator('#password').fill('correcthorse');
    await second.getByRole('button', { name: 'Create account' }).click();
    await expect(second.getByText('That email is already registered.')).toBeVisible();
  });

  test(`${framework}: maintain hides target and rate; imperial swaps inputs`, async ({ page }) => {
    await signUp(page, framework, uniqueEmail());
    await chooseCard(page, 'Maintain weight');
    await continueTo(page, 'A few numbers about you');

    await expect(page.getByText('Target weight')).toHaveCount(0);
    await expect(page.getByText('Weekly rate')).toHaveCount(0);

    await chooseCard(page, 'Imperial (ft, lb)');
    await expect(page.locator('#heightCm')).toHaveCount(0);
    await expect(page.locator('#heightFt')).toBeVisible();
    await expect(page.locator('#weightLb')).toBeVisible();
  });

  test(`${framework}: back and forward preserves answers`, async ({ page }) => {
    await signUp(page, framework, uniqueEmail());
    await chooseCard(page, 'Lose weight');
    await continueTo(page, 'A few numbers about you');
    await fillStats(page, 'metric');

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'What are you here for?' })).toBeVisible();
    await continueTo(page, 'A few numbers about you');

    await expect(page.locator('#heightCm')).toHaveValue('180');
    await expect(page.locator('#weightKg')).toHaveValue('88');
  });
}
