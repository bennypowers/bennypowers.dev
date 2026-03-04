import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-clock';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders time element', async () => {
    const time = demoPage.element.first().locator('time');
    await expect(time).toBeVisible();
  });

  test('time text is not empty', async () => {
    const time = demoPage.element.first().locator('time');
    await expect(time).not.toBeEmpty();
  });

  test('a11y snapshot is present', async () => {
    const snapshot = await demoPage.a11ySnapshot({ nth: 0 });
    expect(snapshot.data).toBeDefined();
  });
});
