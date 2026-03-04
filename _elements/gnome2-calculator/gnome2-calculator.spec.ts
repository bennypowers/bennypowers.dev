import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-calculator';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('display shows 0 initially', async () => {
    const display = demoPage.element.first().locator('#display');
    await expect(display).toHaveText('0');
  });

  test('clicking digit updates display', async () => {
    const element = demoPage.element.first();
    await element.locator('button').filter({ hasText: /^5$/ }).click();
    const display = element.locator('#display');
    await expect(display).toHaveText('5');
  });

  test('clicking operator then equals computes result', async () => {
    const element = demoPage.element.first();
    await element.locator('button').filter({ hasText: /^3$/ }).click();
    await element.locator('button').filter({ hasText: /^\+$/ }).click();
    await element.locator('button').filter({ hasText: /^4$/ }).click();
    await element.locator('button').filter({ hasText: /^=$/ }).click();
    const display = element.locator('#display');
    await expect(display).toHaveText('7');
  });

  test.describe('regressions', () => {
    test('keyboard input works', async ({ page }) => {
      const element = demoPage.element.first();
      const display = element.locator('#display');
      await element.click();
      await page.keyboard.press('5');
      await expect(display).toHaveText('5');
      await page.keyboard.press('+');
      await page.keyboard.press('3');
      await page.keyboard.press('Enter');
      await expect(display).toHaveText('8');
    });

    test('division by zero shows Error', async () => {
      const element = demoPage.element.first();
      const display = element.locator('#display');
      await element.locator('button').filter({ hasText: /^5$/ }).click();
      await element.locator('button').filter({ hasText: /^\u00f7$/ }).click();
      await element.locator('button').filter({ hasText: /^0$/ }).click();
      await element.locator('button').filter({ hasText: /^=$/ }).click();
      await expect(display).toHaveText('Error');
    });
  });
});
