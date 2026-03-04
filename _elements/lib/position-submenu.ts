/**
 * Position a submenu element relative to its trigger, cascading right.
 * Flips left if insufficient viewport space, or overlays parent menu
 * as a last resort.
 */
export function positionSubmenu(
  trigger: HTMLElement,
  submenu: HTMLElement,
  menuWidth = 180,
): void {
  const rect = trigger.getBoundingClientRect();
  let left = rect.right;
  if (left + menuWidth > window.innerWidth) {
    left = rect.left - menuWidth;
  }
  if (left < 0) {
    const parentMenu = trigger.closest('gtk2-menu');
    left = parentMenu?.getBoundingClientRect().left ?? 0;
  }
  submenu.style.top = `${rect.top}px`;
  submenu.style.left = `${left}px`;
}
