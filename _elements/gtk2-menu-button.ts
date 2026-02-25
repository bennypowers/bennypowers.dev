import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('gtk2-menu-button')
export class Gtk2MenuButton extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      height: 100%;
    }

    button {
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: inherit;
      color: var(--cl-panel-text, #2e3436);
      background: none;
      border: none;
      padding: 0 var(--_menubar-padding, 8px);
      height: 100%;
      cursor: default;
      line-height: var(--cl-panel-height, 26px);
      display: inline-flex;
      align-items: center;
      gap: 2px;

      &:hover {
        background: var(--_menubar-hover-bg, light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08)));
      }

      :host([open]) & {
        background: var(--_menubar-active-bg, light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08)));
        color: var(--_menubar-active-text, inherit);
        border-radius: var(--_menubar-active-radius, 0);
      }
    }

    button span::first-letter {
      text-decoration: var(--_menubar-mnemonic, none);
    }

    button:focus-visible {
      outline: 1px solid var(--cl-focus-color, #729fcf);
      outline-offset: -1px;
    }

    ::slotted([slot="icon"]) {
      width: 14px;
      flex-shrink: 0;
    }

    #menu {
      display: none;
      position: absolute;
      top: 100%;
      inset-inline-start: 0;
      z-index: 1000;
    }

    :host([open]) #menu {
      display: block;
    }

    .menu-container {
      background: var(--cl-menu-bg, #ffffff);
      border: 1px solid var(--cl-menu-border, #ababaa);
      border-radius: var(--cl-menu-radius, 0);
      box-shadow: var(--cl-menu-shadow, 1px 1px 3px rgba(0, 0, 0, 0.2));
      padding: 4px 0;
      min-width: 180px;
    }
  `;

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
        <div class="menu-container" role="menu" aria-label=${this.label}>
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
    const item = el?.shadowRoot?.querySelector<HTMLElement>('.item');
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
    document.removeEventListener('click', this.#onOutsideClick);
    document.removeEventListener('keydown', this.#onKeyDown);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu-button': Gtk2MenuButton;
  }
}
