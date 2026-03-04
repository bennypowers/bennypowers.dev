import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-button';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test.describe('component instantiation', () => {
    test('canCreateImperatively', async () => {
      expect(await demoPage.canCreateImperatively()).toBe(true);
    });

    test('should upgrade', async () => {
      const isUpgraded = await demoPage.element.first().evaluate(el =>
        el.matches(':defined'),
      );
      expect(isUpgraded).toBe(true);
    });
  });

  test.describe('functionality', () => {
    test('renders default slot content', async () => {
      const text = await demoPage.element.first().textContent();
      expect(text?.trim()).toBe('Click Me');
    });

    test('disabled button is not clickable', async () => {
      const disabledBtn = demoPage.element.nth(1);
      const innerButton = disabledBtn.locator('button');
      await expect(innerButton).toBeDisabled();
    });

    test('focus ring on focus-visible', async ({ page }) => {
      const innerButton = demoPage.element.first().locator('button');
      await page.keyboard.press('Tab');
      await expect(innerButton).toBeFocused();
    });
  });

  test.describe('accessibility', () => {
    test('has button role', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const button = snapshot.query({ role: 'button' });
      expect(button).not.toBeNull();
    });
  });
});
