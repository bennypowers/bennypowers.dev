import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { positionSubmenu } from '../lib/position-submenu.js';
import styles from './gtk2-menu-item.css';

/**
 * GTK+ 2.20 GtkMenuItem with Clearlooks highlighting. MUST be placed
 * inside `gtk2-menu` or `gtk2-menu-button`. Provides links via `href`,
 * submenu cascading, radio-check state, separators, and icons. Allows
 * keyboard navigation via ArrowUp/ArrowDown/ArrowRight/ArrowLeft.
 *
 * @summary GTK-style menu item with icon, submenu, and link support
 */
@customElement('gtk2-menu-item')
export class Gtk2MenuItem extends LitElement {
  #internals = !isServer ? this.attachInternals() : null;

  static styles = styles;

  /** Display text for the menu item */
  @property() accessor label = '';

  /** Navigation URL. When set, the item renders as an anchor element. */
  @property() accessor href = '';

  /** Icon path relative to /assets/icons/gnome/, e.g. `apps/calculator`. Omit the `.svg` extension. */
  @property({ reflect: true }) accessor icon = '';

  /** When true, renders as a horizontal separator line instead of an interactive item */
  @property({ type: Boolean, reflect: true }) accessor separator = false;

  /** When true, the item is non-interactive and visually dimmed */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** Whether the item's submenu is currently expanded */
  @property({ type: Boolean, reflect: true }) accessor active = false;

  /** When true, displays a radio-button check indicator. Sets `role="menuitemradio"`. */
  @property({ type: Boolean, reflect: true }) accessor checked = false;

  /** Whether this item has a child submenu. Auto-set via `submenu-register` event. */
  @property({ type: Boolean, reflect: true, attribute: 'has-submenu' }) accessor hasSubmenu = false;

  get #iconSrc(): string {
    return this.icon ? `/assets/icons/gnome/${this.icon}.svg` : '';
  }

  #closeTimer: ReturnType<typeof setTimeout> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (this.#internals) this.#internals.role = this.separator ? 'separator' : 'menuitem';
    if (!isServer) {
      this.addEventListener('mouseenter', this.#onMouseEnter);
      this.addEventListener('mouseleave', this.#onMouseLeave);
      this.addEventListener('submenu-register', this.#onSubmenuRegister);
      this.addEventListener('submenu-unregister', this.#onSubmenuUnregister);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#closeTimer);
    this.removeEventListener('mouseenter', this.#onMouseEnter);
    this.removeEventListener('mouseleave', this.#onMouseLeave);
    this.removeEventListener('submenu-register', this.#onSubmenuRegister);
    this.removeEventListener('submenu-unregister', this.#onSubmenuUnregister);
  }

  #onSubmenuRegister = () => {
    // Defer until after hydration so first render matches SSR output
    this.updateComplete.then(() => { this.hasSubmenu = true; });
  };

  #onSubmenuUnregister = () => {
    this.hasSubmenu = false;
  };

  override firstUpdated() {
    // Safe after hydration — detect submenu children via DOM
    this.hasSubmenu = !!this.querySelector('[slot="submenu"]');

    const submenuEl = this.shadowRoot?.querySelector('#submenu');
    if (submenuEl) {
      submenuEl.addEventListener('mouseenter', this.#onSubmenuEnter);
      submenuEl.addEventListener('mouseleave', this.#onMouseLeave);
    }
  }

  override updated(changed: Map<string, unknown>) {
    if (isServer) return;
    if (changed.has('checked') && this.#internals) {
      this.#internals.role = 'menuitemradio';
      this.#internals.ariaChecked = String(this.checked);
    }
    if (changed.has('active')) {
      // Sync submenu open state so its keydown handler works
      const submenu = this.querySelector('[slot="submenu"]') as HTMLElement | null;
      if (submenu && 'open' in submenu) (submenu as any).open = this.active;
      if (this.active) {
        this.#positionSubmenu();
      } else {
        // Cascade-close: clear active from all descendant items
        for (const desc of this.querySelectorAll('gtk2-menu-item[active]')) {
          (desc as Gtk2MenuItem).active = false;
        }
      }
    }
  }

  #onMouseEnter = () => {
    if (this.#isMobile) return; // mobile uses click instead
    // Sync focus for keyboard navigation
    if (!this.separator && !this.disabled) {
      this.shadowRoot?.querySelector<HTMLElement>('#item')?.focus();
    }
    if (!this.hasSubmenu) return;
    clearTimeout(this.#closeTimer);
    // Clear active from sibling items
    for (const sibling of this.parentElement?.querySelectorAll(':scope > gtk2-menu-item[active]') ?? []) {
      if (sibling !== this) (sibling as Gtk2MenuItem).active = false;
    }
    this.active = true;
    this.#positionSubmenu();
  };

  #onSubmenuEnter = () => {
    clearTimeout(this.#closeTimer);
  };

  #onMouseLeave = () => {
    if (!this.hasSubmenu || !this.active) return;
    this.#closeTimer = setTimeout(() => {
      this.active = false;
    }, 300);
  };

  #isMobile = !isServer && matchMedia('(max-width: 767px)').matches;

  #positionSubmenu = () => {
    if (!this.hasSubmenu) return;
    if (this.#isMobile) return;
    const submenu = this.shadowRoot?.querySelector('#submenu') as HTMLElement | null;
    if (!submenu) return;
    positionSubmenu(this, submenu);
  };

  #onItemClick = (e: Event) => {
    // On mobile, items with href navigate directly — no submenu toggle
    if (!this.#isMobile || !this.hasSubmenu || (this.#isMobile && this.href)) return;
    e.preventDefault();
    e.stopPropagation();
    // Toggle submenu on mobile
    if (this.active) {
      this.active = false;
    } else {
      // Close sibling submenus
      for (const sib of this.parentElement?.querySelectorAll(':scope > gtk2-menu-item[active]') ?? []) {
        if (sib !== this) (sib as Gtk2MenuItem).active = false;
      }
      this.active = true;
    }
  };

  render() {
    if (this.separator) {
      return html`<div></div>`;
    }

    const content = html`
      <div id="icon">${this.icon ? html`<img src=${this.#iconSrc} alt="" width="24" height="24">` : nothing}</div>
      <div id="label">${this.label}<!-- Additional label content appended after the label attribute text. --><slot></slot></div>
      ${this.hasSubmenu ? html`<span id="submenu-arrow"></span>` : nothing}
    `;

    return html`
      ${this.href
        ? html`<a id="item" href=${this.href}
                  @click=${this.#onItemClick}
                  ?inert=${this.disabled}
                  tabindex="-1"
                  aria-disabled=${this.disabled ? 'true' : nothing}
                  aria-haspopup=${this.hasSubmenu ? 'menu' : nothing}
                  aria-expanded=${this.hasSubmenu ? String(this.active) : nothing}>${content}</a>`
        : html`<div id="item"
                    @click=${this.#onItemClick}
                    ?inert=${this.disabled}
                    tabindex="-1"
                    aria-disabled=${this.disabled ? 'true' : nothing}
                    aria-haspopup=${this.hasSubmenu ? 'menu' : nothing}
                    aria-expanded=${this.hasSubmenu ? String(this.active) : nothing}>${content}</div>`
      }
      <div id="submenu" role=${this.hasSubmenu ? 'none' : nothing}>
        <!-- A gtk2-menu element for cascading submenus. The child menu MUST set slot="submenu" and will auto-register with the parent item. -->
        <slot name="submenu"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu-item': Gtk2MenuItem;
  }
}
