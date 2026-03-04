import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'ooo-impress-deck';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders thumbnail image', async () => {
    const img = demoPage.element.first().locator('img');
    await expect(img).toBeAttached();
  });

  test('renders label', async () => {
    const label = demoPage.element.first().locator('span');
    await expect(label).not.toBeEmpty();
  });

  test('draft variant shows badge', async ({ page }) => {
    const draftPage = new DemoPage(page, tagName, 'draft');
    await draftPage.goto();
    const draftElement = draftPage.element.first();
    await expect(draftElement).toHaveAttribute('draft', '');
  });
});
