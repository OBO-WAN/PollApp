import { expect, test } from '@playwright/test';

const surveyRequestPattern = /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/surveys/;
const createSurveyRequestPattern =
  /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/rpc\/create_survey/;

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

test('creates a survey in Supabase and persists it across a browser reload', async ({ page }) => {
  const surveyTitle = 'Supabase create integration';

  await page.goto('/surveys/new');
  await page.locator('#survey-title').fill(surveyTitle);
  await page.locator('#survey-description').fill('Created by the Supabase integration test.');
  await page.locator('#survey-category').selectOption('Workplace culture');
  await page.locator('#question-0').fill('Which option should persist?');
  await page.locator('#answer-0-0').fill('First');
  await page.locator('#answer-0-1').fill('Second');

  const createResponse = page.waitForResponse(
    (response) =>
      createSurveyRequestPattern.test(response.url()) &&
      response.request().method() === 'POST' &&
      response.ok(),
  );

  await page.getByRole('button', { name: 'Publish' }).click();
  await createResponse;

  await expect(page.getByText('Your survey is now published')).toBeVisible();

  await page.getByRole('button', { name: 'Return to survey list' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.reload();

  await expect(page.locator('.home-page')).toHaveAttribute('data-survey-source', 'supabase');
  await expect(
    page.getByRole('link', { name: `View survey: ${surveyTitle}` }),
  ).toBeVisible();
});
