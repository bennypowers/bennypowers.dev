import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'nautilus-paginated';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders navigation toolbar', async () => {
    const toolbar = demoPage.element.first().locator('#toolbar');
    await expect(toolbar).toBeVisible();
  });

  test('first page items visible', async () => {
    const element = demoPage.element.first();
    const items = element.locator(':scope > *:not([hidden])');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('next button navigates', async () => {
    const element = demoPage.element.first();
    const nextButton = element.locator('button[aria-label="Next page"]');
    const isDisabled = await nextButton.isDisabled();
    if (!isDisabled) {
      await nextButton.click();
      const pageInfo = element.locator('#page-info');
      await expect(pageInfo).toContainText('2');
    }
  });

  test.describe('regressions', () => {
    test('previous button disabled on first page', async () => {
      const element = demoPage.element.first();
      const prevButton = element.locator('button[aria-label="Previous page"]');
      await expect(prevButton).toBeDisabled();
    });

    test('first button disabled on first page', async () => {
      const element = demoPage.element.first();
      const firstButton = element.locator('button[aria-label="First page"]');
      await expect(firstButton).toBeDisabled();
    });

    test('items beyond page size are hidden', async () => {
      const element = demoPage.element.first();
      const allItems = element.locator(':scope > .page-item');
      const count = await allItems.count();
      expect(count).toBe(15);
      for (let i = 6; i < count; i++) {
        await expect(allItems.nth(i)).toHaveAttribute('hidden', '');
      }
    });
  });
});
