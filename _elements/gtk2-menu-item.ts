import { LitElement, html, css, nothing, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('gtk2-menu-item')
export class Gtk2MenuItem extends LitElement {
  #internals = !isServer ? this.attachInternals() : null;

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    :host([separator]) {
      padding: 3px 0;
    }

    :host([separator]) .separator {
      height: 1px;
      background: var(--cl-menu-separator, #d3d7cf);
      margin: 0 4px;
    }

    .item {
      display: flex;
      align-items: center;
      padding: var(--cl-menu-item-padding, 3px 6px 3px 4px);
      color: var(--cl-menu-item-text, #2e3436);
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--_menu-font-size, var(--cl-font-size, 13px));
      cursor: default;
      white-space: nowrap;
      text-decoration: none;
      position: relative;
      gap: var(--_menu-icon-gap, 6px);
      min-height: var(--_menu-item-height, 28px);
      box-sizing: border-box;
    }

    .item:hover,
    .item:focus-visible,
    :host([active]) .item {
      background: var(--cl-menu-item-hover-bg, linear-gradient(to bottom, #a4c2e8, #9cb9dd, #98b4d8, #90aace));
      color: var(--cl-menu-item-hover-text, #ffffff);
    }

    .item:focus-visible {
      outline: none;
    }

    :host([disabled]) .item {
      color: var(--cl-menu-item-disabled, #888a85);
      cursor: default;
    }

    :host([disabled]) .item:hover {
      background: none;
      color: var(--cl-menu-item-disabled, #888a85);
    }

    #icon {
      width: var(--_menu-icon-size, 24px);
      height: var(--_menu-icon-size, 24px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    :host(:not([icon])) #icon {
      display: none;
    }

    #icon img {
      width: var(--_menu-icon-size, 24px);
      height: var(--_menu-icon-size, 24px);
    }

    #label {
      flex: 1;
    }

    #submenu-arrow {
      margin-inline-start: auto;
      padding-inline-start: 10px;
      width: 0;
      height: 0;
      border-block: 4px solid transparent;
      border-inline-start: 5px solid currentColor;
      border-inline-end: none;
    }

    #submenu {
      display: none;
      position: fixed;
      z-index: 1000;
    }

    :host([active]) #submenu {
      display: block;
    }

    #submenu ::slotted(gtk2-menu) {
      display: block;
      position: static;
    }

    a.item {
      color: inherit;
    }

    a.item:hover {
      color: var(--cl-menu-item-hover-text, #ffffff);
    }
  `;

  @property() accessor label = '';
  @property() accessor href = '';
  @property({ reflect: true }) accessor icon = '';
  @property({ type: Boolean, reflect: true }) accessor separator = false;
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  @property({ type: Boolean, reflect: true }) accessor active = false;

  get hasSubmenu(): boolean {
    if (isServer) return false;
    return !!this.querySelector('[slot="submenu"]');
  }

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
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#closeTimer);
    this.removeEventListener('mouseenter', this.#onMouseEnter);
    this.removeEventListener('mouseleave', this.#onMouseLeave);
  }

  override firstUpdated() {
    const submenuEl = this.shadowRoot?.querySelector('#submenu');
    if (submenuEl) {
      submenuEl.addEventListener('mouseenter', this.#onSubmenuEnter);
      submenuEl.addEventListener('mouseleave', this.#onMouseLeave);
    }
  }

  override updated(changed: Map<string, unknown>) {
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
    // Sync focus for keyboard navigation
    if (!this.separator && !this.disabled) {
      this.shadowRoot?.querySelector<HTMLElement>('.item')?.focus();
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

  #positionSubmenu = () => {
    if (!this.hasSubmenu) return;
    const submenu = this.shadowRoot?.querySelector('#submenu') as HTMLElement | null;
    if (!submenu) return;
    const rect = this.getBoundingClientRect();
    submenu.style.top = `${rect.top}px`;
    submenu.style.left = `${rect.right}px`;
  };

  render() {
    if (this.separator) {
      return html`<div class="separator"></div>`;
    }

    const content = html`
      <div id="icon">${this.icon ? html`<img src=${this.#iconSrc} alt="" width="24" height="24">` : nothing}</div>
      <div id="label">${this.label}<slot></slot></div>
      ${this.hasSubmenu ? html`<span id="submenu-arrow"></span>` : nothing}
    `;

    return html`
      ${this.href
        ? html`<a class="item" href=${this.href}
                  ?inert=${this.disabled}
                  tabindex="-1"
                  aria-disabled=${this.disabled ? 'true' : nothing}
                  aria-haspopup=${this.hasSubmenu ? 'menu' : nothing}
                  aria-expanded=${this.hasSubmenu ? String(this.active) : nothing}>${content}</a>`
        : html`<div class="item"
                    ?inert=${this.disabled}
                    tabindex="-1"
                    aria-disabled=${this.disabled ? 'true' : nothing}
                    aria-haspopup=${this.hasSubmenu ? 'menu' : nothing}
                    aria-expanded=${this.hasSubmenu ? String(this.active) : nothing}>${content}</div>`
      }
      <div id="submenu" role=${this.hasSubmenu ? 'none' : nothing}>
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
