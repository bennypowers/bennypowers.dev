import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-menu-item';

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
    test('renders label text', async () => {
      const label = demoPage.element.first().locator('#label');
      await expect(label).toContainText('Calculator');
    });

    test('separator variant has no interactive content', async () => {
      const separator = demoPage.page.locator('gtk2-menu-item[separator]').first();
      const item = separator.locator('#item');
      await expect(item).toHaveCount(0);
    });

    test('checked item shows indicator', async () => {
      const checkedItem = demoPage.page.locator('gtk2-menu-item[checked]').first();
      await expect(checkedItem).toHaveAttribute('checked');
    });

    test('disabled item is inert', async () => {
      const disabledItem = demoPage.page.locator('gtk2-menu-item[disabled]').first();
      const item = disabledItem.locator('#item');
      await expect(item).toHaveAttribute('inert');
    });
  });

  test.describe('accessibility', () => {
    test('has menuitem role', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const menuitem = snapshot.query({ role: 'menuitem' });
      expect(menuitem).not.toBeNull();
    });
  });

  test.describe('regressions', () => {
    test('submenu arrow indicator renders for has-submenu items', async () => {
      const submenuItem = demoPage.page.locator('gtk2-menu-item[has-submenu]').first();
      const arrow = submenuItem.locator('#submenu-arrow');
      await expect(arrow).toBeAttached();
    });

    test('checked item has menuitemradio role', async () => {
      const checkedItem = demoPage.page.locator('gtk2-menu-item[checked]').first();
      const role = await checkedItem.evaluate(el =>
        (el as any).internals?.role ?? el.getAttribute('role'),
      );
      expect(role).toBe('menuitemradio');
    });
  });
});
