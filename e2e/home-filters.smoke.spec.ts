import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('filters the survey list with the Figma category menu', async ({ page }) => {
  await page.goto('/');

  const trigger = page.getByRole('button', { name: /Filter surveys by category/ });

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();

  const listbox = page.getByRole('listbox', { name: 'Survey categories' });
  const teamActivitiesOption = page.getByRole('option', { name: 'Team activities' });

  await expect(listbox).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await teamActivitiesOption.hover();
  await expect(teamActivitiesOption).toHaveCSS('background-color', 'rgb(244, 233, 251)');
  await teamActivitiesOption.click();

  const cards = page.locator('.survey-list-card');

  await expect(listbox).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.category-filter__selection')).toHaveText('Team activities');
  await expect(cards).toHaveCount(2);
  await expect(cards.locator('.survey-list-card__category')).toHaveText([
    'Team activities',
    'Team activities',
  ]);
});

test('orders active and past surveys by deadline', async ({ page }) => {
  await page.goto('/');

  const surveyTitles = page.locator('.survey-list-card h3');

  await expect(surveyTitles).toHaveText([
    'Let’s Plan the Next Team Event Together',
    'Healthier future: Fit & wellness survey!',
    'Gaming habits and favorite games!',
    'Which games should we play at our next community night?',
    'Which wellness activities should we offer next?',
    'Help us choose the next team-building activity',
  ]);

  await page.getByRole('button', { name: 'Past survey' }).click();

  await expect(surveyTitles).toHaveText([
    'Weekly wellness check-in',
    'Summer team event retrospective',
    'How do you feel about remote work?',
  ]);
});
