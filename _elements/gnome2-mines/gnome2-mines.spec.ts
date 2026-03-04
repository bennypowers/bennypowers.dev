import { test, expect } from '@playwright/test';
import { DemoPage } from '../../tests/pages/demo-page.js';

const tagName = 'gnome2-mines';

test.describe(tagName, () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page, tagName);
    await demoPage.goto();
  });

  test('instantiation', async () => {
    expect(await demoPage.canCreateImperatively()).toBe(true);
  });

  test('renders 64 cells (8x8 grid)', async () => {
    const cells = demoPage.element.first().locator('.cell');
    await expect(cells).toHaveCount(64);
  });

  test('face button resets game', async () => {
    const element = demoPage.element.first();
    const firstCell = element.locator('.cell').first();
    await firstCell.click();
    await element.locator('#face').click();
    const revealedCells = element.locator('.cell.revealed');
    await expect(revealedCells).toHaveCount(0);
  });

  test('clicking cell reveals it', async () => {
    const element = demoPage.element.first();
    const firstCell = element.locator('.cell').first();
    await firstCell.click();
    const revealedCells = element.locator('.cell:not(.hidden)');
    expect(await revealedCells.count()).toBeGreaterThan(0);
  });

  test.describe('regressions', () => {
    test('first click is always safe', async () => {
      const element = demoPage.element.first();
      const firstCell = element.locator('.cell').first();
      await firstCell.click();
      // After the first click, no mine cells should be visible (revealed with mine class)
      // Mines are placed after the first click, so the clicked cell is always safe
      const visibleMines = element.locator('.cell.mine:not(.hidden)');
      await expect(visibleMines).toHaveCount(0);
    });
  });
});
