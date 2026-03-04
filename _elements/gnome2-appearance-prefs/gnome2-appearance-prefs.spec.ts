import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-appearance-prefs';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders theme tab panel', async () => {
    const themePanel = demoPage.element.first().locator('#theme-panel');
    await expect(themePanel).toBeVisible();
  });

  test('renders background tab', async () => {
    const element = demoPage.element.first();
    const bgTab = element.locator('button[slot="tab-1"]');
    await expect(bgTab).toBeVisible();
    await expect(bgTab).toHaveText('Background');
  });

  test.describe('regressions', () => {
    test('clicking theme item selects it', async () => {
      const element = demoPage.element.first();
      const themeItem = element.locator('.theme-item').first();
      await themeItem.click();
      await expect(themeItem).toHaveClass(/selected/);
    });
  });
});
