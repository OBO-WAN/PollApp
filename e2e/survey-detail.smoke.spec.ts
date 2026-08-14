import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('opens a read-only survey detail page from Home', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('link', { name: 'View survey: Let’s Plan the Next Team Event Together' })
    .first()
    .click();

  await expect(page).toHaveURL(/\/surveys\/1$/);
  await expect(
    page.getByRole('heading', { name: 'Let’s Plan the Next Team Event Together' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Survey results LIVE' })).toBeVisible();
  await expect(page.getByText('Which date would work best for you?').first()).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Complete survey' })).toBeDisabled();
  await expect(page.locator('main form')).toHaveCount(0);
});
