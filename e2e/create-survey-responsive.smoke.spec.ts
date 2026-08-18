import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('matches the 375px Create Survey composition as the form grows', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/surveys/new');

  await expect(page.locator('.create-page-logo')).toBeVisible();
  await expect(page.locator('.survey-editor')).toHaveCSS('border-top-right-radius', '100px');

  const initialLayout = await page.evaluate(() => {
    const width = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);

      if (!element) {
        throw new Error(`Missing responsive element: ${selector}`);
      }

      return element.getBoundingClientRect().width;
    };

    return {
      editorTop: document.querySelector<HTMLElement>('.survey-editor')?.getBoundingClientRect().top,
      editorWidth: width('.survey-editor'),
      panelWidth: width('.form-panel'),
      questionWidth: width('.question-card > input'),
      answerWidth: width('#answer-0-0'),
      pageHasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  expect(initialLayout.editorTop).toBe(151);
  expect(initialLayout.editorWidth).toBe(375);
  expect(initialLayout.panelWidth).toBe(340);
  expect(initialLayout.questionWidth).toBe(320);
  expect(initialLayout.answerWidth).toBe(320);
  expect(initialLayout.pageHasOverflow).toBe(false);

  await page.getByRole('button', { name: 'Add answer' }).click();
  await page.getByRole('button', { name: 'Add next question' }).click();

  await expect(page.locator('.question-card')).toHaveCount(2);

  const expandedPageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(expandedPageHasOverflow).toBe(false);

  await page.setViewportSize({ width: 320, height: 812 });

  const minimumWidthHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(minimumWidthHasOverflow).toBe(false);
});

test('keeps the Create Survey form fluid at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/surveys/new');

  await expect(page.locator('.survey-details')).toHaveCSS('grid-template-columns', '576px');
  await expect(page.locator('.question-builder')).toHaveCSS('grid-template-columns', '576px');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
});
