import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('matches the 375px Create Survey composition as the form grows', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/surveys/new');

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
  await page.goto('/#/surveys/new');

  await expect(page.locator('.survey-details')).toHaveCSS('grid-template-columns', '576px');
  await expect(page.locator('.questions')).toHaveCSS('grid-template-columns', '576px');

  const pageHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(pageHasOverflow).toBe(false);
});

test('transitions the publish button into its Figma hover state', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.goto('/#/surveys/new');

  const publishButton = page.getByRole('button', { name: 'Publish' });
  const hoverIcon = page.locator('.publish-button__icon');

  await expect(hoverIcon).toHaveCSS('width', '0px');
  await expect(hoverIcon).toHaveCSS('opacity', '0');

  await publishButton.hover();

  await expect(publishButton).toHaveCSS('background-color', 'rgb(255, 183, 112)');
  await expect(hoverIcon).toHaveCSS('width', '18px');
  await expect(hoverIcon).toHaveCSS('margin-left', '10px');
  await expect(hoverIcon).toHaveCSS('opacity', '1');
});

for (const viewportWidth of [981, 1200]) {
  test(`lays questions out in two columns at ${viewportWidth}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewportWidth, height: 1000 });
    await page.goto('/#/surveys/new');

    const addQuestion = page.getByRole('button', { name: 'Add next question' });
    await addQuestion.click();
    await addQuestion.click();

    const layout = await page.evaluate(() => {
      const questions = [...document.querySelectorAll<HTMLElement>('.question-card')].map((card) =>
        card.getBoundingClientRect().toJSON(),
      );
      const button = document
        .querySelector<HTMLElement>('.secondary-action')
        ?.getBoundingClientRect()
        .toJSON();
      const root = document.documentElement;

      return {
        questions,
        button,
        pageHasOverflow: root.scrollWidth > root.clientWidth,
      };
    });

    expect(layout.questions).toHaveLength(3);
    expect(layout.questions[0].top).toBe(layout.questions[1].top);
    expect(layout.questions[2].top).toBeGreaterThan(layout.questions[0].bottom);
    expect(layout.button?.top).toBeGreaterThan(layout.questions[2].bottom);
    expect(layout.pageHasOverflow).toBe(false);
  });
}

test('stacks questions and keeps the add button below them at 980px', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 1000 });
  await page.goto('/#/surveys/new');

  const addQuestion = page.getByRole('button', { name: 'Add next question' });
  await addQuestion.click();

  const firstQuestion = await page.locator('.question-card').nth(0).boundingBox();
  const secondQuestion = await page.locator('.question-card').nth(1).boundingBox();
  const button = await addQuestion.boundingBox();

  expect(firstQuestion).not.toBeNull();
  expect(secondQuestion?.y).toBeGreaterThan((firstQuestion?.y ?? 0) + (firstQuestion?.height ?? 0));
  expect(button?.y).toBeGreaterThan((secondQuestion?.y ?? 0) + (secondQuestion?.height ?? 0));
});
