import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-menu-button';

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
    test('dropdown hidden by default', async () => {
      await expect(demoPage.element.first()).not.toHaveAttribute('open');
    });

    test('click opens dropdown', async () => {
      const trigger = demoPage.element.first().locator('button');
      await trigger.click();
      await expect(demoPage.element.first()).toHaveAttribute('open');
    });

    test('click again closes dropdown', async () => {
      const trigger = demoPage.element.first().locator('button');
      await trigger.click();
      await expect(demoPage.element.first()).toHaveAttribute('open');
      await trigger.click();
      await expect(demoPage.element.first()).not.toHaveAttribute('open');
    });
  });

  test.describe('accessibility', () => {
    test('has menuitem role with aria-haspopup', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const menuitem = snapshot.query({ role: 'menuitem' });
      expect(menuitem).not.toBeNull();

      const trigger = demoPage.element.first().locator('button');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });
  });
});
