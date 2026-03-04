import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'nautilus-folder';

test.describe(tagName, () => {
  test.describe('icon view', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      demoPage = new DemoPage(page, tagName);
      await demoPage.goto();
    });

    test('instantiation', async () => {
      expect(await demoPage.canCreateImperatively()).toBe(true);
    });

    test('renders folder items in icon view', async () => {
      const element = demoPage.element.first();
      const items = element.locator(':scope > *');
      expect(await items.count()).toBeGreaterThan(0);
    });
  });

  test.describe('list view', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      demoPage = new DemoPage(page, tagName, 'list');
      await demoPage.goto();
    });

    test('switching to list view shows header', async () => {
      const header = demoPage.element.first().locator('#list-header');
      await expect(header).toBeVisible();
    });
  });

  test.describe('regressions', () => {
    test('sort indicator appears on sorted column', async ({ page }) => {
      const demoPage = new DemoPage(page, tagName, 'list');
      await demoPage.goto();
      const sortedButton = demoPage.element.first().locator('#list-header button.sorted');
      await expect(sortedButton).toBeAttached();
    });
  });
});
