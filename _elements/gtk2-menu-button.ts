import { LitElement, html, isServer, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-menu-button.css';

@customElement('gtk2-menu-button')
export class Gtk2MenuButton extends LitElement {
  static styles = styles;

  @property() accessor label = '';
  @property({ type: Boolean, reflect: true }) accessor open = false;

  render() {
    return html`
      <button part="trigger"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded=${this.open}
              @click=${this.#onTriggerClick}>
        <slot name="icon"></slot>
        <span>${this.label}</span>
      </button>
      <div id="menu">
        <div id="menu-container" role="menu" aria-label=${this.label}>
          <slot></slot>
        </div>
      </div>
    `;
  }

  #onTriggerClick() {
    if (this.open) {
      this.hide();
    } else {
      // close sibling menu buttons
      for (const other of document.querySelectorAll('gtk2-menu-button[open]')) {
        if (other !== this) (other as Gtk2MenuButton).hide();
      }
      this.show();
    }
  }

  show() {
    this.open = true;
    document.addEventListener('click', this.#onOutsideClick);
    document.addEventListener('keydown', this.#onKeyDown);
    // Focus first item after render
    requestAnimationFrame(() => this.#focusItem(this.#getItems()[0]));
  }

  hide() {
    this.open = false;
    document.removeEventListener('click', this.#onOutsideClick);
    document.removeEventListener('keydown', this.#onKeyDown);
  }

  #onOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.hide();
    }
  };

  /** Direct child menu items only (not nested submenu items) */
  #getItems(): HTMLElement[] {
    return [...this.querySelectorAll(':scope > gtk2-menu-item:not([separator]):not([disabled])')] as HTMLElement[];
  }

  #focusItem(el: HTMLElement | undefined) {
    const item = el?.shadowRoot?.querySelector<HTMLElement>('#item');
    item?.focus();
    item?.scrollIntoView({ block: 'nearest' });
  }

  #onKeyDown = (e: KeyboardEvent) => {
    // Don't handle if focus is inside a nested submenu (its own handler has priority)
    if (e.key !== 'Escape' && !this.#getItems().some(el => el.matches(':focus-within'))) return;
    switch (e.key) {
      case 'Escape':
        this.hide();
        this.shadowRoot?.querySelector('button')?.focus();
        e.preventDefault();
        break;
      case 'ArrowDown': {
        const items = this.#getItems();
        const current = items.findIndex(el => el.matches(':focus-within'));
        this.#focusItem(items[current < items.length - 1 ? current + 1 : 0]);
        e.preventDefault();
        break;
      }
      case 'ArrowUp': {
        const items = this.#getItems();
        const current = items.findIndex(el => el.matches(':focus-within'));
        this.#focusItem(items[current > 0 ? current - 1 : items.length - 1]);
        e.preventDefault();
        break;
      }
      case 'ArrowRight': {
        const items = this.#getItems();
        const current = items.find(el => el.matches(':focus-within'));
        if (current && (current as any).hasSubmenu) {
          // Clear sibling active states first
          for (const sibling of this.querySelectorAll(':scope > gtk2-menu-item[active]')) {
            if (sibling !== current) (sibling as any).active = false;
          }
          current.setAttribute('active', '');
          const submenu = current.querySelector('gtk2-menu') as import('./gtk2-menu.js').Gtk2Menu | null;
          if (submenu) {
            submenu.open = true;
            this.#focusItem(submenu.getItems()[0]);
          }
        }
        e.preventDefault();
        break;
      }
      case 'Home':
        this.#focusItem(this.#getItems()[0]);
        e.preventDefault();
        break;
      case 'End': {
        const items = this.#getItems();
        this.#focusItem(items[items.length - 1]);
        e.preventDefault();
        break;
      }
    }
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
    document.removeEventListener('click', this.#onOutsideClick);
    document.removeEventListener('keydown', this.#onKeyDown);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu-button': Gtk2MenuButton;
  }
}
