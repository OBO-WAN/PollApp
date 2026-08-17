import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

const endingSoonSurveys = [
  {
    id: '1',
    title: 'Let’s Plan the Next Team Event Together',
    firstQuestion: 'Which date would work best for you?',
  },
  {
    id: '4',
    title: 'Healthier future: Fit & wellness survey!',
    firstQuestion: 'Which wellness goals are most important to you?',
  },
  {
    id: '2',
    title: 'Gaming habits and favorite games!',
    firstQuestion: 'How often do you play video games?',
  },
] as const;

test('shows the three earliest surveys in deadline order', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.highlight-card');
  await expect(cards).toHaveCount(3);

  for (const [index, survey] of endingSoonSurveys.entries()) {
    await expect(cards.nth(index)).toContainText(survey.title);
  }
});

for (const survey of endingSoonSurveys) {
  test(`opens unique voting content for survey ${survey.id}`, async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('link', { name: `View survey: ${survey.title}` })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/surveys/${survey.id}$`));
    await expect(page.getByRole('heading', { name: survey.title })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Survey results LIVE' })).toBeVisible();
    await expect(page.getByText(survey.firstQuestion).first()).toBeVisible();
    await expect(page.locator('.question-item')).toHaveCount(4);
    await expect(page.locator('.answer-option input').first()).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Complete survey' })).toBeDisabled();
    await expect(page.locator('main form')).toHaveCount(1);
  });
}

test('submits a vote once and refreshes the live results', async ({ page }) => {
  await page.goto('/surveys/1');

  const questions = page.locator('.question-item');
  const completeButton = page.getByRole('button', { name: 'Complete survey' });
  const selectedResult = page.locator('.result-item').first().locator('.result-value').nth(2);

  await questions.nth(0).locator('input').nth(2).check();
  await questions.nth(1).locator('input').first().check();
  await questions.nth(2).locator('input').first().check();
  await questions.nth(3).locator('input').first().check();

  await expect(completeButton).toBeEnabled();
  await expect(selectedResult).toHaveText('3%');

  await completeButton.click();

  await expect(page.locator('#vote-status')).toContainText('Your vote has been recorded');
  await expect(selectedResult).toHaveText('4%');
  await expect(page.locator('.answer-option input').first()).toBeDisabled();
  await expect(completeButton).toBeDisabled();
});

test('opens a past survey with final results and no voting controls enabled', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Past survey' }).click();
  await page.getByRole('link', { name: 'View survey: How do you feel about remote work?' }).click();

  await expect(page).toHaveURL(/\/surveys\/7$/);
  await expect(
    page.getByRole('heading', { name: 'How do you feel about remote work?' }),
  ).toBeVisible();
  await expect(
    page.getByText('This survey has ended. Final results are shown below.'),
  ).toBeVisible();
  await expect(page.locator('.question-item')).toHaveCount(2);
  await expect(page.locator('.answer-option input')).toHaveCount(7);
  await expect(page.locator('.answer-option input').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Survey closed' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Survey results', exact: true })).toBeVisible();
  await expect(page.getByText('LIVE', { exact: true })).toHaveCount(0);
});
