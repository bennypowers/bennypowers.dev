import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'desktop-icon';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders icon image', async () => {
    const img = demoPage.element.first().locator('img');
    await expect(img).toBeVisible();
  });

  test('renders label text', async () => {
    const label = demoPage.element.first().locator('#label');
    await expect(label).not.toBeEmpty();
  });

  test('link is focusable', async () => {
    const snapshot = await demoPage.a11ySnapshot({ nth: 0 });
    const link = snapshot.query({ role: 'link' });
    expect(link).not.toBeNull();
  });
});
