import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'pidgin-conversation';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders conversation area', async () => {
    const conversation = demoPage.element.first().locator('#conversation');
    await expect(conversation).toBeVisible();
  });

  test('renders protocol bar', async () => {
    const protocolBar = demoPage.element.first().locator('#protocol-bar');
    await expect(protocolBar).toBeVisible();
  });

  test('messages are visible', async () => {
    const messages = demoPage.element.first().locator('pidgin-message');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  test.describe('regressions', () => {
    test('protocol buttons are interactive', async () => {
      const element = demoPage.element.first();
      const fediverseButton = element.locator('#protocol-bar button', { hasText: 'Fediverse' });
      await fediverseButton.click();
      await expect(fediverseButton).toHaveClass(/selected/);
    });

    test('send button disabled when no protocol selected', async () => {
      const element = demoPage.element.first();
      const sendButton = element.locator('#send');
      await expect(sendButton).toBeDisabled();
    });
  });
});
