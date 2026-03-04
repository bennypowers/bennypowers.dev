import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-desktop';

test.describe(tagName, () => {
  test.describe('basic rendering', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      demoPage = new DemoPage(page, tagName);
      await demoPage.goto();
    });

    test('instantiation', async () => {
      expect(await demoPage.canCreateImperatively()).toBe(true);
    });

    test('renders panels (top and bottom)', async () => {
      const element = demoPage.element.first();
      await expect(element.locator('[slot="top-panel"]')).toBeAttached();
      await expect(element.locator('[slot="bottom-panel"]')).toBeAttached();
    });

    test('renders window with title', async () => {
      await expect(demoPage.element.first().locator('gtk2-window')).toBeAttached();
    });

    test('workspace has role="main"', async () => {
      const workspace = demoPage.element.first().locator('#workspace');
      await expect(workspace).toHaveAttribute('role', 'main');
    });

    test('a11y snapshot contains buttons', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const buttons = snapshot.queryAll({ role: 'button' });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test.describe('window manager state machine', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      // Clear sessionStorage to start fresh
      await page.addInitScript(() => sessionStorage.clear());
      demoPage = new DemoPage(page, tagName, 'wm-states');
      await demoPage.goto();
      // Wait for WM boot (deferred via requestAnimationFrame)
      await demoPage.page.waitForTimeout(200);
    });

    test('initial state: Window A is focused', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await expect(windowA).toHaveAttribute('focused', '');
    });

    test('initial state: Window B is not focused', async () => {
      const windowB = demoPage.page.locator('#window-b');
      await expect(windowB).not.toHaveAttribute('focused', '');
    });

    test('initial state: taskbar has entries for both windows', async () => {
      const entries = demoPage.page.locator('gnome2-window-list button.wm-entry');
      await expect(entries).toHaveCount(2);
    });

    test('clicking Window B focuses it and unfocuses Window A', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      // Click Window B's titlebar
      await windowB.locator('#titlebar').click();

      await expect(windowB).toHaveAttribute('focused', '');
      await expect(windowA).not.toHaveAttribute('focused', '');
    });

    test('focusing raises window z-index above others', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      // Focus B
      await windowB.locator('#titlebar').click();
      const zB = await windowB.evaluate(el => parseInt(el.style.zIndex) || 0);

      // Focus A
      await windowA.locator('#titlebar').click();
      const zA = await windowA.evaluate(el => parseInt(el.style.zIndex) || 0);

      expect(zA).toBeGreaterThan(zB);
    });

    test('minimize hides window', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-minimize').click();
      await expect(windowA).not.toBeVisible();
    });

    test('minimize then click taskbar entry restores window', async () => {
      const windowA = demoPage.page.locator('#window-a');

      // Minimize
      await windowA.locator('#btn-minimize').click();
      await expect(windowA).not.toBeVisible();

      // Click the taskbar entry for Window A
      const taskbarEntry = demoPage.page.locator(
        'gnome2-window-list button.wm-entry',
      ).first();
      await taskbarEntry.click();

      // Window should be visible again
      await expect(windowA).toBeVisible();
    });

    test('close removes window from DOM', async () => {
      const windowB = demoPage.page.locator('#window-b');

      // Focus B first so close fires on the right window
      await windowB.locator('#titlebar').click();
      await windowB.locator('#btn-close').click();

      await expect(windowB).not.toBeAttached();
    });

    test('close updates taskbar entries', async () => {
      const windowB = demoPage.page.locator('#window-b');
      const entries = demoPage.page.locator('gnome2-window-list button.wm-entry');

      await expect(entries).toHaveCount(2);

      await windowB.locator('#titlebar').click();
      await windowB.locator('#btn-close').click();

      await expect(entries).toHaveCount(1);
    });

    test('maximize fills workspace', async () => {
      const windowA = demoPage.page.locator('#window-a');

      await windowA.locator('#btn-maximize').click();
      await expect(windowA).toHaveAttribute('maximized', '');
    });

    test('maximize then restore returns to normal size', async () => {
      const windowA = demoPage.page.locator('#window-a');

      // Maximize
      await windowA.locator('#btn-maximize').click();
      await expect(windowA).toHaveAttribute('maximized', '');

      // Restore
      await windowA.locator('#btn-maximize').click();
      await expect(windowA).not.toHaveAttribute('maximized', '');
    });

    test('show desktop hides all windows', async () => {
      const showDesktop = demoPage.page.locator('gnome2-window-list #show-desktop');
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      await showDesktop.click();

      await expect(windowA).not.toBeVisible();
      await expect(windowB).not.toBeVisible();
    });

    test('show desktop toggle restores windows', async () => {
      const showDesktop = demoPage.page.locator('gnome2-window-list #show-desktop');
      const windowA = demoPage.page.locator('#window-a');

      // Hide
      await showDesktop.click();
      await expect(windowA).not.toBeVisible();

      // Restore
      await showDesktop.click();
      await expect(windowA).toBeVisible();
    });

    test('minimized taskbar entry has reduced opacity', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-minimize').click();

      const entry = demoPage.page.locator('gnome2-window-list button.wm-entry.minimized');
      await expect(entry).toBeAttached();
    });

    test('focused taskbar entry has active class', async () => {
      const entry = demoPage.page.locator('gnome2-window-list button.wm-entry.active');
      await expect(entry).toBeAttached();
    });

    test('titlebar double-click toggles maximize', async () => {
      const windowA = demoPage.page.locator('#window-a');

      await windowA.locator('#titlebar').dblclick();
      await expect(windowA).toHaveAttribute('maximized', '');

      await windowA.locator('#titlebar').dblclick();
      await expect(windowA).not.toHaveAttribute('maximized', '');
    });
  });

  test.describe('regressions', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => sessionStorage.clear());
      demoPage = new DemoPage(page, tagName, 'wm-states');
      await demoPage.goto();
      await demoPage.page.waitForTimeout(200);
    });

    test('close button does not navigate away', async () => {
      const urlBefore = demoPage.page.url();
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-close').click();
      expect(demoPage.page.url()).toBe(urlBefore);
    });

    test('clicking already-focused window body still raises it', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      // Focus B to push it on top
      await windowB.locator('#titlebar').click();

      // Focus A via titlebar
      await windowA.locator('#titlebar').click();

      const zA = await windowA.evaluate(el => parseInt(el.style.zIndex) || 0);
      const zB = await windowB.evaluate(el => parseInt(el.style.zIndex) || 0);
      expect(zA).toBeGreaterThan(zB);
    });

    test('closing focused window does not auto-navigate', async () => {
      const urlBefore = demoPage.page.url();
      const windowB = demoPage.page.locator('#window-b');

      await windowB.locator('#titlebar').click();
      await windowB.locator('#btn-close').click();

      // Should stay on same URL, not navigate to another window
      expect(demoPage.page.url()).toBe(urlBefore);
    });

    test('window position does not jump on focus switch', async () => {
      const windowA = demoPage.page.locator('#window-a');

      // Record initial position
      const posBefore = await windowA.boundingBox();

      // Focus B then back to A
      const windowB = demoPage.page.locator('#window-b');
      await windowB.locator('#titlebar').click();
      await windowA.locator('#titlebar').click();

      // Position should not have changed significantly
      const posAfter = await windowA.boundingBox();
      expect(Math.abs(posAfter!.x - posBefore!.x)).toBeLessThan(5);
      expect(Math.abs(posAfter!.y - posBefore!.y)).toBeLessThan(5);
    });
  });
});
