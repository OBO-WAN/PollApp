import { expect, Page, test } from '@playwright/test';

const workflowViewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

for (const viewport of workflowViewports) {
  test(`completes the in-memory survey workflow on ${viewport.name}`, async ({ page }) => {
    const surveyTitle = `Feedback workflow ${viewport.name}`;

    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'New survey' }).click();

    await validateRequiredFields(page);
    await createSurvey(page, surveyTitle);
    await openCreatedSurvey(page, surveyTitle);
    await voteAndVerifyResults(page, surveyTitle);
  });
}

async function validateRequiredFields(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Publish' }).click();

  await expect(page.locator('#survey-title')).toBeFocused();
  await expect(page.locator('#survey-title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter a survey name.')).toBeVisible();
  await expect(page.getByText('Choose a category.')).toBeVisible();
  await expect(page.getByText('Enter a question.')).toBeVisible();
  await expect(page.getByText('Enter an answer.')).toHaveCount(2);
  await expect(page.locator('.published-notice')).toHaveCount(0);
}

async function createSurvey(page: Page, surveyTitle: string): Promise<void> {
  await page.locator('#survey-title').fill(surveyTitle);
  await page
    .locator('#survey-description')
    .fill('A complete browser journey for the frontend survey workflow.');
  await page.locator('#survey-category').selectOption('Workplace culture');

  const firstQuestion = page.locator('.question-card').first();

  await firstQuestion.locator('#question-0').fill('Where should the next workshop happen?');
  await firstQuestion.locator('#answer-0-0').fill('Remote');
  await firstQuestion.locator('#answer-0-1').fill('In person');

  await page.getByRole('button', { name: 'Add next question' }).click();

  const secondQuestion = page.locator('.question-card').nth(1);

  await secondQuestion.locator('#question-1').fill('Which topics should we cover?');
  await secondQuestion.getByRole('checkbox', { name: 'Allow multiple answers.' }).check();
  await secondQuestion.locator('#answer-1-0').fill('Accessibility');
  await secondQuestion.locator('#answer-1-1').fill('Testing');
  await secondQuestion.getByRole('button', { name: 'Add answer' }).click();
  await secondQuestion.locator('#answer-1-2').fill('Performance');

  await page.getByRole('button', { name: 'Publish' }).click();

  await expect(page.getByText('Your survey is now published')).toBeVisible();
  await page.getByRole('button', { name: 'Return to survey list' }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function openCreatedSurvey(page: Page, surveyTitle: string): Promise<void> {
  await page
    .getByRole('button', { name: /Filter surveys by category\. Current selection:/ })
    .click();
  await page.getByRole('option', { name: 'Workplace culture' }).click();

  const surveyLink = page.getByRole('link', { name: `View survey: ${surveyTitle}` });

  await expect(surveyLink).toContainText('Workplace culture');
  await expect(surveyLink).toContainText('No deadline');
  await surveyLink.click();

  await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible();
  await expect(page.getByText('Category: Workplace culture')).toBeVisible();
  await expect(
    page.getByText('A complete browser journey for the frontend survey workflow.'),
  ).toBeVisible();
  await expect(page.locator('.question-item')).toHaveCount(2);
  await expect(page.locator('.question-item').first().getByRole('radio')).toHaveCount(2);
  await expect(page.locator('.question-item').nth(1).getByRole('checkbox')).toHaveCount(3);
}

async function voteAndVerifyResults(page: Page, surveyTitle: string): Promise<void> {
  const questions = page.locator('.question-item');
  const resultItems = page.locator('.result-item');
  const completeButton = page.locator('.complete-survey-button');

  await expect(completeButton).toBeDisabled();
  await expect(resultItems.nth(0).locator('.result-value')).toHaveText(['0%', '0%']);
  await expect(resultItems.nth(1).locator('.result-value')).toHaveText(['0%', '0%', '0%']);

  await questions.nth(0).getByRole('radio').first().check();
  await questions.nth(1).getByRole('checkbox').nth(0).check();
  await questions.nth(1).getByRole('checkbox').nth(2).check();

  await expect(completeButton).toBeEnabled();
  await completeButton.click();

  await expect(page.locator('#vote-status')).toContainText('Your vote has been recorded');
  await expect(resultItems.nth(0).locator('.result-value')).toHaveText(['100%', '0%']);
  await expect(resultItems.nth(1).locator('.result-value')).toHaveText(['50%', '0%', '50%']);
  await expect(page.locator('.answer-option input')).toBeDisabled();
  await expect(completeButton).toBeDisabled();

  await page
    .locator('.survey-form')
    .evaluate((form) =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );

  await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible();
  await expect(resultItems.nth(0).locator('.result-value')).toHaveText(['100%', '0%']);
  await expect(resultItems.nth(1).locator('.result-value')).toHaveText(['50%', '0%', '50%']);
}
