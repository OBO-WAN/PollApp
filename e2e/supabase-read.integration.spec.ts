import { expect, test } from '@playwright/test';

const surveyRequestPattern = /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/surveys/;
const createSurveyRequestPattern = /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/rpc\/create_survey/;
const submitVoteRequestPattern = /^http:\/\/127\.0\.0\.1:54321\/rest\/v1\/rpc\/submit_survey_vote/;
const anonymousVoterTokenKey = 'pollapp.anonymous-voter-token';

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
  await expect(page.getByRole('link', { name: `View survey: ${surveyTitle}` })).toBeVisible();
});

test('submits a persistent vote and surfaces a duplicate without fixture fallback', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: 'View survey: Let’s Plan the Next Team Event Together' })
    .first()
    .click();

  const questions = page.locator('.question-item');
  await questions.nth(0).locator('input').nth(2).check();
  await questions.nth(1).locator('input').first().check();
  await questions.nth(2).locator('input').first().check();
  await questions.nth(3).locator('input').first().check();

  const selectedResult = page.locator('.result-item').first().locator('.result-value').nth(2);
  await expect(selectedResult).toHaveText('3%');

  const anonymousToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    anonymousVoterTokenKey,
  );
  expect(anonymousToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  const voteResponse = page.waitForResponse(
    (response) =>
      submitVoteRequestPattern.test(response.url()) && response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Complete survey' }).click();
  expect((await voteResponse).ok()).toBe(true);

  await expect(page.locator('#vote-status')).toContainText('Your vote has been recorded');
  await expect(selectedResult).toHaveText('4%');

  await page.reload();

  expect(await page.evaluate((key) => localStorage.getItem(key), anonymousVoterTokenKey)).toBe(
    anonymousToken,
  );
  await expect(selectedResult).toHaveText('4%');

  await questions.nth(0).locator('input').nth(2).check();
  await questions.nth(1).locator('input').first().check();
  await questions.nth(2).locator('input').first().check();
  await questions.nth(3).locator('input').first().check();

  const duplicateResponse = page.waitForResponse(
    (response) =>
      submitVoteRequestPattern.test(response.url()) && response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Complete survey' }).click();
  expect((await duplicateResponse).ok()).toBe(false);

  await expect(page.getByRole('alert')).toHaveText('Unable to submit your vote.');
  await expect(selectedResult).toHaveText('4%');
  await expect(page.getByRole('button', { name: 'Complete survey' })).toBeEnabled();
});
