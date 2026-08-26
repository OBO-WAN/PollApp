import { expect, Page, test } from '@playwright/test';

const workflowViewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }),
  );
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

for (const viewport of workflowViewports) {
  test(`completes the in-memory survey workflow on ${viewport.name}`, async ({ page }) => {
    const surveyTitle = `Feedback workflow ${viewport.name}`;

    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'New survey' }).click();

    await verifyCategoryControlStyle(page);
    await validateRequiredFields(page);
    await createSurvey(page, surveyTitle);
    await verifyCreatedSurvey(page, surveyTitle);
    await voteAndVerifyResults(page, surveyTitle);
  });
}

async function verifyCategoryControlStyle(page: Page): Promise<void> {
  const categoryMenu = page.locator('.category-select');
  const categoryTrigger = page.locator('#survey-category');

  await expect(categoryTrigger).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.1)');
  await expect(categoryTrigger).toHaveCSS('color', 'rgb(254, 253, 255)');
  await expect(categoryTrigger).toHaveCSS('font-size', '18px');
  await expect(categoryTrigger).toHaveCSS('font-weight', '700');
  await expect(page.locator('#survey-end-date')).toHaveCSS('cursor', 'pointer');

  await categoryTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(categoryMenu).toHaveAttribute('open', '');
  await expect(
    page.locator('.category-option').filter({ hasText: 'Team activities' }).locator('span'),
  ).toBeVisible();
  await expect(
    page.locator('.category-option').filter({ hasText: 'Team activities' }).locator('span'),
  ).toHaveCSS('color', 'rgb(255, 183, 112)');
  await page.keyboard.press('Escape');
  await expect(categoryMenu).not.toHaveAttribute('open', '');
  await expect(page).toHaveURL(/\/#\/surveys\/new$/);

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
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
  await chooseCategory(page, 'Workplace culture');

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

  await expect(page.getByRole('status')).toContainText('Your survey is now published');
  await expect(page).toHaveURL(/\/#\/surveys\/new$/);
  await expect(page).toHaveURL(/\/#\/surveys\/[^/]+$/);
}

async function chooseCategory(page: Page, category: string): Promise<void> {
  const categoryMenu = page.locator('.category-select');
  const categoryTrigger = page.locator('#survey-category');
  const categoryRadio = page.getByRole('radio', { name: category });

  await categoryTrigger.focus();
  await page.keyboard.press('Enter');
  await categoryRadio.focus();
  await page.keyboard.press('Space');

  await expect(categoryRadio).toBeChecked();
  await expect(categoryMenu).not.toHaveAttribute('open', '');
  await expect(categoryTrigger).toContainText(category);
}

async function verifyCreatedSurvey(page: Page, surveyTitle: string): Promise<void> {
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
  await expect(resultItems.nth(0).locator('.result-value')).toHaveText(['100%', '0%']);
  await expect(resultItems.nth(1).locator('.result-value')).toHaveText(['50%', '0%', '50%']);
  await completeButton.click();

  await expect(page.getByRole('status')).toContainText('Your vote was submitted successfully');
  await expect(page).toHaveURL(/\/#\/surveys\/[^/]+$/);
  await expect(page).toHaveURL(/\/$/);
  const surveyLink = page.getByRole('link', { name: `View survey: ${surveyTitle}` });
  await expect(surveyLink).toBeVisible();
  await surveyLink.click();

  await expect(
    page.getByRole('status').filter({ hasText: 'You have already completed this survey.' }),
  ).toBeVisible();
  await expect(resultItems.nth(0).locator('.result-value')).toHaveText(['100%', '0%']);
  await expect(resultItems.nth(1).locator('.result-value')).toHaveText(['50%', '0%', '50%']);
  await expect(page.locator('.answer-option input:enabled')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Survey completed' })).toBeDisabled();
}
