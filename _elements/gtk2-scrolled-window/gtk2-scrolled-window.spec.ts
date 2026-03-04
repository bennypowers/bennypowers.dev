import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gtk2-scrolled-window';

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
    test('content is scrollable', async () => {
      const viewport = demoPage.element.first().locator('#viewport');
      const isScrollable = await viewport.evaluate(el =>
        el.scrollHeight > el.clientHeight,
      );
      expect(isScrollable).toBe(true);
    });
  });

  test.describe('accessibility', () => {
    test('snapshot present', async () => {
      const snapshot = await demoPage.a11ySnapshot();
      expect(snapshot.data).toBeDefined();
    });
  });

  test.describe('regressions', () => {
    test('has overscroll-behavior: contain', async () => {
      const overscrollBehavior = await demoPage.element.first().evaluate(el =>
        getComputedStyle(el).overscrollBehavior,
      );
      expect(overscrollBehavior).toBe('contain');
    });

    test('body does not scroll when content scrolls', async ({ page }) => {
      const bodyScrollBefore = await page.evaluate(() => document.body.scrollTop);
      const viewport = demoPage.element.first().locator('#viewport');
      // Scroll the viewport content down
      await viewport.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      const bodyScrollAfter = await page.evaluate(() => document.body.scrollTop);
      expect(bodyScrollAfter).toBe(bodyScrollBefore);
    });
  });
});
