import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('matches the 375px Home composition without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const layout = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);

      if (!element) {
        throw new Error(`Missing responsive element: ${selector}`);
      }

      return element.getBoundingClientRect().toJSON();
    };

    const root = document.documentElement;
    const carousel = document.querySelector<HTMLElement>('.ending-soon__cards');

    return {
      hero: bounds('.hero'),
      title: bounds('.hero h1'),
      visual: bounds('.hero__visual'),
      intro: bounds('.hero p'),
      button: bounds('.primary-button'),
      highlights: bounds('.survey-highlights'),
      highlight: bounds('.highlight-card'),
      filters: bounds('.survey-filters'),
      surveyList: bounds('.survey-list'),
      surveyCard: bounds('.survey-list-card'),
      pageHasOverflow: root.scrollWidth > root.clientWidth,
      carouselScrolls: carousel ? carousel.scrollWidth > carousel.clientWidth : false,
    };
  });

  expect(layout.hero.width).toBe(343);
  expect(layout.highlight.width).toBe(250);
  expect(layout.highlight.height).toBe(233);
  expect(layout.highlights.height).toBe(382);
  expect(layout.filters.top - layout.highlights.bottom).toBe(48);
  expect(layout.surveyList.top - layout.filters.bottom).toBe(24);
  expect(layout.surveyCard.width).toBe(343);
  expect(layout.surveyCard.height).toBe(147);
  expect(layout.title.bottom).toBeLessThanOrEqual(layout.visual.top);
  expect(layout.visual.bottom).toBeLessThanOrEqual(layout.intro.top);
  expect(layout.intro.bottom).toBeLessThanOrEqual(layout.button.top);
  expect(layout.pageHasOverflow).toBe(false);
  expect(layout.carouselScrolls).toBe(true);
});

test('keeps the Home layout fluid at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  await expect(page.locator('.survey-list')).toHaveCSS('grid-template-columns', '720px');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
});
