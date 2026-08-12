import { expect, test } from '@playwright/test';

test('opens the new survey page from Home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New survey' }).click();

  await expect(page).toHaveURL(/\/surveys\/new$/);
  await expect(page.getByRole('heading', { name: 'Create new survey' })).toBeVisible();
});

test('returns Home when survey creation is cancelled', async ({ page }) => {
  await page.goto('/surveys/new');

  await page.getByRole('link', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'New survey' })).toBeVisible();
});