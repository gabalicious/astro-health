import { expect, type Page, test } from '@playwright/test';

/**
 * Login and settings flows for both frameworks. Same conventions as the signup
 * spec: unique emails against the in-memory store, hydration waits before
 * interacting, \s+ in regexes because Svelte keeps template newlines.
 */

const FRAMEWORKS = ['vue', 'svelte'] as const;
type Framework = (typeof FRAMEWORKS)[number];

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const PASSWORD = 'correcthorse';

async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('astro-island:not([ssr])');
}

async function signUp(page: Page, framework: Framework, email: string) {
  await gotoHydrated(page, `/signup/${framework}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(`/onboarding/${framework}`);
}

async function logIn(page: Page, framework: Framework, email: string, password = PASSWORD) {
  await gotoHydrated(page, `/login/${framework}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

/** Signup → complete metric onboarding; returns the plan calories text. */
async function onboard(page: Page, framework: Framework, email: string): Promise<string> {
  await signUp(page, framework, email);
  await page.getByText('Lose weight', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'A few numbers about you' })).toBeVisible();

  await page.locator('#heightCm').fill('180');
  await page.locator('#weightKg').fill('88');
  await page.locator('#targetWeightKg').fill('79');
  await page.getByText('0.5 kg · about 1 lb per week', { exact: true }).click();
  await page.locator('#age').fill('34');
  await page.locator('#sex').click();
  await page.getByRole('option', { name: 'Male', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Moderately active', { exact: true }).click();
  await page.getByRole('button', { name: 'Finish setup' }).click();

  const calories = page.getByTestId('plan-calories');
  await expect(calories).toBeVisible();
  return (await calories.textContent()) ?? '';
}

for (const framework of FRAMEWORKS) {
  test(`${framework}: wrong password is a form-level alert, not a field error`, async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail();
    await signUp(page, framework, email);

    const fresh = await (await browser.newContext()).newPage();
    await logIn(fresh, framework, email, 'wrongwrong');

    await expect(fresh.getByRole('alert')).toContainText('Wrong email or password.');
    // Neither field gets the blame — that would confirm which half was right.
    await expect(fresh.locator('p.text-destructive')).toHaveCount(1);
  });

  test(`${framework}: login before onboarding lands on onboarding`, async ({ page, browser }) => {
    const email = uniqueEmail();
    await signUp(page, framework, email); // account exists, no profile yet

    const fresh = await (await browser.newContext()).newPage();
    await logIn(fresh, framework, email);
    await expect(fresh).toHaveURL(`/onboarding/${framework}`);
  });

  test(`${framework}: settings prefills, gates Save on change, and recomputes the plan`, async ({
    page,
  }) => {
    const email = uniqueEmail();
    const originalCalories = await onboard(page, framework, email);

    await gotoHydrated(page, `/settings/${framework}`);

    // Prefilled from the stored profile, sectioned, not a wizard.
    await expect(page.locator('#heightCm')).toHaveValue('180');
    await expect(page.locator('#weightKg')).toHaveValue('88');
    await expect(page.locator('#targetWeightKg')).toHaveValue('79');
    await expect(page.getByText('Step 1 of')).toHaveCount(0);

    // Nothing changed yet, so there is nothing to save.
    const save = page.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();

    await page.locator('#weightKg').fill('84');
    await expect(save).toBeEnabled();
    await save.click();

    const calories = page.getByTestId('plan-calories');
    await expect(calories).toBeVisible();
    await expect(calories).not.toHaveText(originalCalories);

    // "Adjust again" reloads the form seeded with the new answers.
    await page.getByRole('link', { name: 'Adjust again' }).click();
    await page.waitForSelector('astro-island:not([ssr])');
    await expect(page.locator('#weightKg')).toHaveValue('84');
  });

  test(`${framework}: logout ends the session and settings bounces to login`, async ({ page }) => {
    await onboard(page, framework, uniqueEmail());

    await gotoHydrated(page, `/settings/${framework}`);
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(`/login/${framework}`);

    await page.goto(`/settings/${framework}`);
    await expect(page).toHaveURL(`/login/${framework}`);
  });

  test(`${framework}: login after onboarding lands on settings`, async ({ page, browser }) => {
    const email = uniqueEmail();
    await onboard(page, framework, email);

    const fresh = await (await browser.newContext()).newPage();
    await logIn(fresh, framework, email);
    await expect(fresh).toHaveURL(`/settings/${framework}`);
  });

  test(`${framework}: remember me toggles via its label`, async ({ page }) => {
    await gotoHydrated(page, `/login/${framework}`);

    const box = page.getByRole('checkbox', { name: 'Remember me' });
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'false');
  });

  test(`${framework}: unit toggle on settings clears rather than converts (documented)`, async ({
    page,
  }) => {
    await onboard(page, framework, uniqueEmail());
    await gotoHydrated(page, `/settings/${framework}`);

    await page.getByText('Imperial (ft, lb)', { exact: true }).click();
    await expect(page.locator('#weightLb')).toHaveValue('');
  });
}
