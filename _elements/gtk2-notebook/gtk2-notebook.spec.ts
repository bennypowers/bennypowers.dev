import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-notebook';

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
    test('first tab active by default', async () => {
      const firstTab = demoPage.page.locator('[slot="tab-0"]');
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    test('clicking tab switches panel', async () => {
      const secondTab = demoPage.page.locator('[slot="tab-1"]');
      await secondTab.click();
      const secondPanel = demoPage.page.locator('[slot="panel-1"]');
      await expect(secondPanel).toHaveAttribute('aria-hidden', 'false');
      const firstPanel = demoPage.page.locator('[slot="panel-0"]');
      await expect(firstPanel).toHaveAttribute('aria-hidden', 'true');
    });

    test('ARIA selected updates', async () => {
      const firstTab = demoPage.page.locator('[slot="tab-0"]');
      const secondTab = demoPage.page.locator('[slot="tab-1"]');
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');
      await expect(secondTab).toHaveAttribute('aria-selected', 'false');
      await secondTab.click();
      await expect(firstTab).toHaveAttribute('aria-selected', 'false');
      await expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('accessibility', () => {
    test('has tab and tabpanel roles', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      const tab = snapshot.query({ role: 'tab' });
      expect(tab).not.toBeNull();
      const tabpanel = snapshot.query({ role: 'tabpanel' });
      expect(tabpanel).not.toBeNull();
    });
  });

  test.describe('regressions', () => {
    test('tab panels have correct aria-labelledby', async () => {
      const firstTab = demoPage.page.locator('[slot="tab-0"]');
      const firstPanel = demoPage.page.locator('[slot="panel-0"]');
      const tabId = await firstTab.getAttribute('id');
      const labelledBy = await firstPanel.getAttribute('aria-labelledby');
      expect(labelledBy).toBe(tabId);
    });

    test('inactive panels are hidden', async () => {
      const secondPanel = demoPage.page.locator('[slot="panel-1"]');
      await expect(secondPanel).toHaveAttribute('aria-hidden', 'true');
      const thirdPanel = demoPage.page.locator('[slot="panel-2"]');
      await expect(thirdPanel).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
