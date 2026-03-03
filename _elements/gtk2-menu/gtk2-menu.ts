import { LitElement, html, isServer, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-menu.css';

/**
 * A dropdown or context menu container modeled after GTK+ 2.20 GtkMenu.
 * Holds `gtk2-menu-item` children and provides keyboard navigation
 * (Arrow keys, Home, End, Escape). When used as a submenu, MUST be
 * slotted into `gtk2-menu-item`'s `submenu` slot and will auto-register
 * with the parent item via `submenu-register` event.
 * Supports ARIA menu pattern with `role="menu"`.
 *
 * @summary GTK-style dropdown menu container
 *
 * @fires open - When the menu becomes visible via `show()`. No detail data.
 * @fires close - When the menu is hidden via `hide()`. No detail data.
 */
@customElement('gtk2-menu')
export class Gtk2Menu extends LitElement {
  static styles = styles;

  /** Whether the menu is visible. Set via `show()`/`hide()`/`toggle()`. */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  /** Accessible label for the menu's `aria-label`. SHOULD describe the menu's purpose. */
  @property({ attribute: 'accessible-label' }) accessor accessibleLabel = '';

  render() {
    return html`
      <!-- The menu popup container. Use to override background, border, or shadow. -->
      <div id="menu" role="menu" part="menu" aria-label=${this.accessibleLabel || nothing}>
        <!-- Menu content. MUST contain gtk2-menu-item elements. Items receive focus via keyboard navigation. Separator items are supported. -->
        <slot></slot>
      </div>
    `;
  }

  show() {
    this.open = true;
    this.dispatchEvent(new Event('open'));
  }

  hide() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }

  toggle() {
    if (this.open) this.hide();
    else this.show();
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.addEventListener('keydown', this.#onKeyDown);
    if (this.slot === 'submenu') {
      this.dispatchEvent(new Event('submenu-register', { bubbles: true }));
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
    this.removeEventListener('keydown', this.#onKeyDown);
    if (this.slot === 'submenu') {
      this.dispatchEvent(new Event('submenu-unregister', { bubbles: true }));
    }
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;
    switch (e.key) {
      case 'Escape':
        this.hide();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowDown':
        this.#focusNext();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowUp':
        this.#focusPrev();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowRight':
        this.#openSubmenu();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowLeft':
        this.#closeToParent();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'Home':
        this.#focusFirst();
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'End':
        this.#focusLast();
        e.preventDefault();
        e.stopPropagation();
        break;
    }
  };

  /** Menu items in this menu, resolving forwarded slots */
  getItems(): HTMLElement[] {
    if (isServer) return [];
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    if (!slot) return [];
    return (slot.assignedElements({ flatten: true }) as HTMLElement[])
      .filter(el => el.matches('gtk2-menu-item:not([separator]):not([disabled])'));
  }

  #focusItem(el: HTMLElement | undefined) {
    const item = el?.shadowRoot?.querySelector<HTMLElement>('#item');
    item?.focus();
    item?.scrollIntoView({ block: 'nearest' });
  }

  #focusNext() {
    const items = this.getItems();
    const current = items.findIndex(el => el.matches(':focus-within'));
    this.#focusItem(items[current < items.length - 1 ? current + 1 : 0]);
  }

  #focusPrev() {
    const items = this.getItems();
    const current = items.findIndex(el => el.matches(':focus-within'));
    this.#focusItem(items[current > 0 ? current - 1 : items.length - 1]);
  }

  #focusFirst() {
    this.#focusItem(this.getItems()[0]);
  }

  #focusLast() {
    const items = this.getItems();
    this.#focusItem(items[items.length - 1]);
  }

  /** ArrowRight: if focused item has a submenu, open it and focus its first item */
  #openSubmenu() {
    const items = this.getItems();
    const current = items.find(el => el.matches(':focus-within'));
    if (!current || !(current as any).hasSubmenu) return;
    // Clear sibling active states first
    for (const item of items) {
      if (item !== current && item.hasAttribute('active')) {
        (item as any).active = false;
      }
    }
    current.setAttribute('active', '');
    const submenu = current.querySelector('gtk2-menu') as Gtk2Menu | null;
    if (submenu) {
      submenu.open = true;
      this.#focusItem(submenu.getItems()[0]);
    }
  }

  /** ArrowLeft: close this submenu and focus the parent menu item */
  #closeToParent() {
    // This menu is slotted inside a gtk2-menu-item's [slot="submenu"]
    const parentItem = this.closest('gtk2-menu-item[active]') as HTMLElement | null;
    if (parentItem) {
      parentItem.removeAttribute('active');
      this.open = false;
      parentItem.shadowRoot?.querySelector<HTMLElement>('#item')?.focus();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu': Gtk2Menu;
  }
}
