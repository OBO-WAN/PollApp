import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('loads and reloads a deep link through the root document', async ({ page }) => {
  const initialResponse = await page.goto('/#/surveys/1');

  if (!initialResponse) {
    throw new Error('Expected the initial route to return a document response.');
  }

  expect(initialResponse.status()).toBe(200);
  expect(new URL(initialResponse.url()).pathname).toBe('/');
  await expect(
    page.getByRole('heading', { name: 'Let’s Plan the Next Team Event Together' }),
  ).toBeVisible();

  const reloadResponse = await page.reload();

  if (!reloadResponse) {
    throw new Error('Expected the reloaded route to return a document response.');
  }

  expect(reloadResponse.status()).toBe(200);
  expect(new URL(reloadResponse.url()).pathname).toBe('/');
  await expect(
    page.getByRole('heading', { name: 'Let’s Plan the Next Team Event Together' }),
  ).toBeVisible();
});
