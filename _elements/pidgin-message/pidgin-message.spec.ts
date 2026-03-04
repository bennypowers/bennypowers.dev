import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'pidgin-message';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('reply shows author name and body', async ({ page }) => {
    const reply = page.locator('pidgin-message[type="reply"]').first();
    const sender = reply.locator('#sender');
    const body = reply.locator('#body');
    await expect(sender).not.toBeEmpty();
    await expect(body).toBeAttached();
  });

  test('like shows "likes this"', async ({ page }) => {
    const like = page.locator('pidgin-message[type="like"]').first();
    const actionText = like.locator('#action-text');
    await expect(actionText).toContainText('likes this');
  });

  test('repost shows "shared this"', async ({ page }) => {
    const repost = page.locator('pidgin-message[type="repost"]').first();
    const actionText = repost.locator('#action-text');
    await expect(actionText).toContainText('shared this');
  });

  test.describe('regressions', () => {
    test('timestamp is formatted in 12-hour time', async ({ page }) => {
      const message = page.locator('pidgin-message').first();
      const timestamp = message.locator('#timestamp');
      const text = await timestamp.textContent();
      // Should match pattern like "(12:34:56 AM)" or "(1:23:45 PM)"
      expect(text?.trim()).toMatch(/\(\d{1,2}:\d{2}:\d{2}\s[AP]M\)/);
    });
  });
});
