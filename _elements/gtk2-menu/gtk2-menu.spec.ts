import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-menu';

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
    test('menu hidden when not open', async ({ page }) => {
      await demoPage.element.first().evaluate(el => {
        el.removeAttribute('open');
      });
      await expect(demoPage.element.first()).not.toHaveAttribute('open');
    });

    test('menu visible when open attribute set', async () => {
      await expect(demoPage.element.first()).toHaveAttribute('open');
      await expect(demoPage.element.first()).toBeVisible();
    });

    test('escape closes menu', async ({ page }) => {
      await expect(demoPage.element.first()).toHaveAttribute('open');
      await demoPage.element.first().locator('#menu').focus();
      await page.keyboard.press('Escape');
      await expect(demoPage.element.first()).not.toHaveAttribute('open');
    });
  });

  test.describe('accessibility', () => {
    test('has menu role', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const menu = snapshot.query({ role: 'menu' });
      expect(menu).not.toBeNull();
    });
  });

  test.describe('regressions', () => {
    test('keyboard ArrowDown navigates to next item', async ({ page }) => {
      await expect(demoPage.element.first()).toHaveAttribute('open');
      await demoPage.element.first().locator('#menu').focus();
      await page.keyboard.press('ArrowDown');
      const focusedItem = demoPage.element.first().locator('gtk2-menu-item');
      // The first menu item should have focus-within after ArrowDown
      const hasFocus = await focusedItem.first().evaluate(el =>
        el.matches(':focus-within'),
      );
      expect(hasFocus).toBe(true);
    });

    test('keyboard ArrowUp navigates to previous item', async ({ page }) => {
      await expect(demoPage.element.first()).toHaveAttribute('open');
      await demoPage.element.first().locator('#menu').focus();
      // Press ArrowDown twice to go to second item
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      // Press ArrowUp to go back to first item
      await page.keyboard.press('ArrowUp');
      const firstItem = demoPage.element.first().locator('gtk2-menu-item').first();
      const hasFocus = await firstItem.evaluate(el =>
        el.matches(':focus-within'),
      );
      expect(hasFocus).toBe(true);
    });
  });
});
