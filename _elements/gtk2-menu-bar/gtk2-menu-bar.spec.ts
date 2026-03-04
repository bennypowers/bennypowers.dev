import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-menu-bar';

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
    test('renders slotted menu buttons', async () => {
      const buttons = demoPage.page.locator('gtk2-menu-bar gtk2-menu-button');
      await expect(buttons).toHaveCount(2);
    });
  });

  test.describe('accessibility', () => {
    test('has menubar role', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const menubar = snapshot.query({ role: 'menubar' });
      expect(menubar).not.toBeNull();
    });
  });
});
