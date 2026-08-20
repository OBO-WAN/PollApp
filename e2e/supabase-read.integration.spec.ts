import { expect, test } from '@playwright/test';

const surveyRequestPattern = /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/surveys/;

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('loads seeded surveys through the Angular Supabase repository', async ({ page }) => {
  const surveyResponse = page.waitForResponse(
    (response) => surveyRequestPattern.test(response.url()) && response.ok(),
  );

  await page.goto('/');
  await surveyResponse;

  const home = page.locator('.home-page');

  await expect(home).toHaveAttribute('data-survey-source', 'supabase');
  await expect(page.getByRole('link', { name: /View survey:/ })).toHaveCount(9);
  await expect(
    page
      .getByRole('link', { name: 'View survey: Let’s Plan the Next Team Event Together' })
      .first(),
  ).toBeVisible();
});

test('shows fixture data and a warning when the local API is unavailable', async ({ page }) => {
  await page.route(surveyRequestPattern, (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('.home-page')).toHaveAttribute('data-survey-source', 'fixtures');
  await expect(page.getByRole('alert')).toContainText('Showing sample surveys');
  await expect(
    page
      .getByRole('link', { name: 'View survey: Let’s Plan the Next Team Event Together' })
      .first(),
  ).toBeVisible();
});
