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
      await page.addInitScript(() => sessionStorage.clear());
      demoPage = new DemoPage(page, tagName, 'wm-states');
      await demoPage.goto();
      // Wait for WM boot (rAF) + context propagation
      await demoPage.page.waitForTimeout(500);
    });

    test('initial state: Window A is focused', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await expect(windowA).toHaveAttribute('focused', { timeout: 5000 });
    });

    test('initial state: Window B is not focused', async () => {
      const windowB = demoPage.page.locator('#window-b');
      await expect(windowB).not.toHaveAttribute('focused', '');
    });

    test('initial state: taskbar has entries for both windows', async () => {
      const entries = demoPage.page.locator('gnome2-window-list button.wm-entry');
      await expect(entries).toHaveCount(2, { timeout: 5000 });
    });

    test('clicking Window B focuses it and unfocuses Window A', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      await windowB.locator('#titlebar').click({ force: true });

      await expect(windowB).toHaveAttribute('focused', '');
      await expect(windowA).not.toHaveAttribute('focused', '');
    });

    test('focusing raises window z-index above others', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      // Focus B first
      await windowB.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);
      const zB = await windowB.evaluate(el => parseInt(el.style.zIndex) || 0);

      // Then focus A
      await windowA.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);
      const zA = await windowA.evaluate(el => parseInt(el.style.zIndex) || 0);

      expect(zA).toBeGreaterThan(zB);
    });

    test('minimize hides window', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-minimize').click({ force: true });
      await expect(windowA).not.toBeVisible();
    });

    test('minimize then click taskbar entry restores window', async () => {
      const windowA = demoPage.page.locator('#window-a');

      await windowA.locator('#btn-minimize').click({ force: true });
      await expect(windowA).not.toBeVisible();

      // Click the first taskbar entry (Window A)
      const entry = demoPage.page.locator('gnome2-window-list button.wm-entry').first();
      await entry.click();

      await expect(windowA).toBeVisible();
    });

    test('close removes window from DOM', async () => {
      const windowB = demoPage.page.locator('#window-b');

      await windowB.locator('#titlebar').click({ force: true });
      await windowB.locator('#btn-close').click({ force: true });

      await expect(windowB).not.toBeAttached();
    });

    test('close updates taskbar entries', async () => {
      const windowB = demoPage.page.locator('#window-b');
      const entries = demoPage.page.locator('gnome2-window-list button.wm-entry');

      await expect(entries).toHaveCount(2, { timeout: 5000 });

      await windowB.locator('#titlebar').click({ force: true });
      await windowB.locator('#btn-close').click({ force: true });

      await expect(entries).toHaveCount(1);
    });

    test('maximize fills workspace', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-maximize').click({ force: true });
      await expect(windowA).toHaveAttribute('maximized', '');
    });

    test('maximize then restore returns to normal size', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-maximize').click({ force: true });
      await expect(windowA).toHaveAttribute('maximized', '');
      await windowA.locator('#btn-maximize').click({ force: true });
      await expect(windowA).not.toHaveAttribute('maximized', '');
    });

    test('show desktop hides all windows', async () => {
      const showDesktop = demoPage.page.locator('gnome2-window-list #show-desktop');
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      await showDesktop.click({ force: true });

      await expect(windowA).not.toBeVisible();
      await expect(windowB).not.toBeVisible();
    });

    test('show desktop toggle restores windows', async () => {
      const showDesktop = demoPage.page.locator('gnome2-window-list #show-desktop');
      const windowA = demoPage.page.locator('#window-a');

      await showDesktop.click({ force: true });
      await expect(windowA).not.toBeVisible();

      await showDesktop.click({ force: true });
      await expect(windowA).toBeVisible();
    });

    test('minimized taskbar entry has minimized class', async () => {
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-minimize').click({ force: true });

      const entry = demoPage.page.locator('gnome2-window-list button.wm-entry.minimized');
      await expect(entry).toBeAttached({ timeout: 3000 });
    });

    test('focused taskbar entry has active class', async () => {
      const entry = demoPage.page.locator('gnome2-window-list button.wm-entry.active');
      await expect(entry).toBeAttached({ timeout: 5000 });
    });

    test('titlebar double-click toggles maximize', async () => {
      const windowA = demoPage.page.locator('#window-a');

      await windowA.locator('#titlebar').dblclick({ force: true });
      await expect(windowA).toHaveAttribute('maximized', '');

      await windowA.locator('#titlebar').dblclick({ force: true });
      await expect(windowA).not.toHaveAttribute('maximized', '');
    });
  });

  test.describe('regressions', () => {
    let demoPage: DemoPage;

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => sessionStorage.clear());
      demoPage = new DemoPage(page, tagName, 'wm-states');
      await demoPage.goto();
      await demoPage.page.waitForTimeout(500);
    });

    test('close button does not navigate away', async () => {
      const urlBefore = demoPage.page.url();
      const windowA = demoPage.page.locator('#window-a');
      await windowA.locator('#btn-close').click({ force: true });
      expect(demoPage.page.url()).toBe(urlBefore);
    });

    test('clicking already-focused window body still raises it', async () => {
      const windowA = demoPage.page.locator('#window-a');
      const windowB = demoPage.page.locator('#window-b');

      await windowB.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);

      await windowA.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);

      const zA = await windowA.evaluate(el => parseInt(el.style.zIndex) || 0);
      const zB = await windowB.evaluate(el => parseInt(el.style.zIndex) || 0);
      expect(zA).toBeGreaterThan(zB);
    });

    test('closing focused window does not auto-navigate', async () => {
      const urlBefore = demoPage.page.url();
      const windowB = demoPage.page.locator('#window-b');

      await windowB.locator('#titlebar').click({ force: true });
      await windowB.locator('#btn-close').click({ force: true });

      expect(demoPage.page.url()).toBe(urlBefore);
    });

    test('window position does not jump on focus switch', async () => {
      const windowA = demoPage.page.locator('#window-a');

      const posBefore = await windowA.boundingBox();

      const windowB = demoPage.page.locator('#window-b');
      await windowB.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);
      await windowA.locator('#titlebar').click({ force: true });
      await demoPage.page.waitForTimeout(100);

      const posAfter = await windowA.boundingBox();
      expect(Math.abs(posAfter!.x - posBefore!.x)).toBeLessThan(5);
      expect(Math.abs(posAfter!.y - posBefore!.y)).toBeLessThan(5);
    });
  });
});
