import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'ooo-impress';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders view tabs', async () => {
    const tabs = demoPage.element.first().locator('[role="tab"]');
    expect(await tabs.count()).toBe(5);
  });

  test('Normal tab selected by default', async () => {
    const normalTab = demoPage.element.first().locator('#tab-normal');
    await expect(normalTab).toHaveAttribute('aria-selected', 'true');
  });

  test.describe('regressions', () => {
    test('clicking Slide Sorter tab changes view', async () => {
      const element = demoPage.element.first();
      const sorterTab = element.locator('#tab-sorter');
      await sorterTab.click();
      await expect(element).toHaveAttribute('view', 'sorter');
    });
  });
});
