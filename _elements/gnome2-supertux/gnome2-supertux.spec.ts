import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-supertux';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders either iframe or fallback content', async () => {
    const element = demoPage.element.first();
    const iframe = element.locator('iframe');
    const fallback = element.locator('#fallback');
    const hasIframe = await iframe.count() > 0;
    const hasFallback = await fallback.count() > 0;
    expect(hasIframe || hasFallback).toBe(true);
  });
});
