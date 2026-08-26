import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('matches the 375px survey voting composition and results accordion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/surveys/1');

  await expect(page.locator('.app-logo')).toBeVisible();
  await expect(page.locator('.create-survey-link')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Close survey and return home' })).toBeVisible();
  await expect(page.locator('.survey-card')).toHaveCSS('border-top-right-radius', '100px');
  await expect(page.locator('#survey-title')).toHaveCSS('font-size', '48px');

  const mobileLayout = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);

      if (!element) {
        throw new Error(`Missing responsive element: ${selector}`);
      }

      return element.getBoundingClientRect();
    };
    const card = bounds('.survey-card');
    const results = bounds('.survey-results');

    return {
      cardLeft: card.left,
      cardWidth: card.width,
      resultsWidth: results.width,
      pageHasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  expect(mobileLayout.cardLeft).toBe(16);
  expect(mobileLayout.cardWidth).toBe(343);
  expect(mobileLayout.resultsWidth).toBe(315);
  expect(mobileLayout.pageHasOverflow).toBe(false);

  const resultsToggle = page.getByRole('button', { name: 'Close results' });

  await expect(resultsToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#survey-results-panel')).toBeVisible();
  await resultsToggle.click();
  await expect(page.getByRole('button', { name: 'See results' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(page.locator('#survey-results-panel')).toBeHidden();
});

test('avoids horizontal overflow at the 320px minimum width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/#/surveys/1');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
  await expect(page.locator('.survey-card')).toHaveCSS('width', '288px');
  await expect(page.locator('.survey-results')).toHaveCSS('width', '288px');
});

test('keeps survey voting fluid at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#/surveys/1');

  await expect(page.locator('.create-survey-link')).toBeVisible();
  await expect(page.locator('.survey-card')).toHaveCSS('width', '688px');
  await expect(page.locator('.result-list')).toHaveCSS('grid-template-columns', '332px 332px');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
});

test('transitions the Create survey link into its Figma hover state', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.goto('/#/surveys/1');

  const createSurveyLink = page.getByRole('link', { name: 'Create survey' });
  const hoverIcon = page.locator('.create-survey-link__icon');

  await expect(hoverIcon).toHaveCSS('width', '0px');
  await expect(hoverIcon).toHaveCSS('opacity', '0');

  await createSurveyLink.hover();

  await expect(createSurveyLink).toHaveCSS('background-color', 'rgb(255, 183, 112)');
  await expect(hoverIcon).toHaveCSS('width', '24px');
  await expect(hoverIcon).toHaveCSS('margin-left', '10px');
  await expect(hoverIcon).toHaveCSS('opacity', '1');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
});

test('uses the same mobile result accordion for a past survey', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/surveys/7');

  await expect(
    page.getByText('This survey has ended. Final results are shown below.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Survey closed' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Close results' })).toBeVisible();
  await expect(page.getByText('LIVE', { exact: true })).toHaveCount(0);
});
