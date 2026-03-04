import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-about';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders banner image', async () => {
    const banner = demoPage.element.first().locator('#banner');
    await expect(banner).toBeVisible();
  });

  test('renders navigation links', async () => {
    const nav = demoPage.element.first().locator('nav');
    const links = nav.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('renders bio text', async () => {
    const bio = demoPage.element.first().locator('#bio');
    await expect(bio).not.toBeEmpty();
  });

  test.describe('regressions', () => {
    test('h-card slot content is rendered', async () => {
      const hCard = demoPage.page.locator('gnome2-about [slot="h-card"]');
      await expect(hCard).toBeAttached();
      await expect(hCard).toContainText('Benny Powers');
    });
  });
});
