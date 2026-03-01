import { LitElement, html, isServer, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-menu.css';

@customElement('gtk2-menu')
export class Gtk2Menu extends LitElement {
  static styles = styles;

  @property({ type: Boolean, reflect: true }) accessor open = false;
  @property({ attribute: 'accessible-label' }) accessor accessibleLabel = '';

  render() {
    return html`
      <div id="menu" role="menu" part="menu" aria-label=${this.accessibleLabel || nothing}>
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
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#onKeyDown);
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
