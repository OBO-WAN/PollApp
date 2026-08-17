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
  test(`opens unique read-only detail content for survey ${survey.id}`, async ({ page }) => {
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
    await expect(page.getByRole('checkbox').first()).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Complete survey' })).toBeDisabled();
    await expect(page.locator('main form')).toHaveCount(0);
  });
}
