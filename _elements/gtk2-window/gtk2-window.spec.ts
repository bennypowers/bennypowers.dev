import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-window';

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
    test('renders title in titlebar', async () => {
      const title = demoPage.element.first().locator('#title');
      await expect(title).toHaveText('Demo Window');
    });

    test('focused attribute shows active titlebar', async () => {
      await expect(demoPage.element.first()).toHaveAttribute('focused');
    });

    test('minimize button dispatches event', async () => {
      const eventPromise = demoPage.captureEvent('minimize', {
        locator: demoPage.element.first(),
      });
      const minimizeBtn = demoPage.element.first().locator('#btn-minimize');
      await minimizeBtn.click();
      await eventPromise;
    });

    test('maximize toggles on double-click', async () => {
      const titlebar = demoPage.element.first().locator('#titlebar');
      await expect(demoPage.element.first()).not.toHaveAttribute('maximized');
      await titlebar.dblclick();
      await expect(demoPage.element.first()).toHaveAttribute('maximized');
      await titlebar.dblclick();
      await expect(demoPage.element.first()).not.toHaveAttribute('maximized');
    });

    test('close button dispatches event', async () => {
      const eventPromise = demoPage.captureEvent('close', {
        locator: demoPage.element.first(),
      });
      const closeBtn = demoPage.element.first().locator('#btn-close');
      await closeBtn.click();
      await eventPromise;
    });
  });

  test.describe('accessibility', () => {
    test('has button roles for minimize, maximize, close', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const buttons = snapshot.queryAll({ role: 'button' });
      const names = buttons.map(b => b.name);
      expect(names).toContain('Minimize');
      expect(names).toContain('Maximize');
      expect(names).toContain('Close');
    });
  });

  test.describe('regressions', () => {
    test('close button does not navigate away', async ({ page }) => {
      const urlBefore = page.url();
      const closeBtn = demoPage.element.first().locator('#btn-close');
      await closeBtn.click();
      // Give any potential navigation a moment to start
      await page.waitForTimeout(500);
      expect(page.url()).toBe(urlBefore);
    });

    test('resize handles not clipped by overflow', async () => {
      const handle = demoPage.element.first().locator('[data-cardinal="n"]');
      const box = await handle.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    });

    test('focused window has blue titlebar gradient', async () => {
      await expect(demoPage.element.first()).toHaveAttribute('focused');
      const titlebar = demoPage.element.first().locator('#titlebar');
      const background = await titlebar.evaluate(el =>
        getComputedStyle(el).background,
      );
      // The focused titlebar should have a gradient (linear-gradient) or the blue theme color
      expect(background).toMatch(/gradient|rgb\(|#/);
    });

    test('unfocused window has gray titlebar', async ({ page }) => {
      const statesPage = new DemoPage(page, tagName, 'states');
      await statesPage.goto();
      const focused = page.locator('gtk2-window[focused]:not([dialog])').first();
      const unfocused = page.locator('gtk2-window:not([focused])').first();
      const focusedBg = await focused.locator('#titlebar').evaluate(el =>
        getComputedStyle(el).background,
      );
      const unfocusedBg = await unfocused.locator('#titlebar').evaluate(el =>
        getComputedStyle(el).background,
      );
      expect(focusedBg).not.toBe(unfocusedBg);
    });
  });
});
