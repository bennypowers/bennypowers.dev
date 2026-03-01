import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-menu-item.css';

@customElement('gtk2-menu-item')
export class Gtk2MenuItem extends LitElement {
  #internals = !isServer ? this.attachInternals() : null;

  static styles = styles;

  @property() accessor label = '';
  @property() accessor href = '';
  @property({ reflect: true }) accessor icon = '';
  @property({ type: Boolean, reflect: true }) accessor separator = false;
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  @property({ type: Boolean, reflect: true }) accessor active = false;

  get hasSubmenu(): boolean {
    if (isServer) return false;
    if (!this.querySelector('[slot="submenu"]')) return false;
    // On mobile, items with href navigate directly — no submenu needed
    if (this.#isMobile && this.href) return false;
    return true;
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

  #isMobile = typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches;

  #positionSubmenu = () => {
    if (!this.hasSubmenu) return;
    // Mobile: submenus expand inline (CSS handles it)
    if (this.#isMobile) return;
    // Desktop: cascade to the right, flip left, or overlay parent
    const submenu = this.shadowRoot?.querySelector('#submenu') as HTMLElement | null;
    if (!submenu) return;
    const rect = this.getBoundingClientRect();
    const menuWidth = 180; // matches gtk2-menu min-width
    let left = rect.right;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth;
    }
    if (left < 0) {
      const parentMenu = this.closest('gtk2-menu');
      left = parentMenu?.getBoundingClientRect().left ?? 0;
    }
    submenu.style.top = `${rect.top}px`;
    submenu.style.left = `${left}px`;
  };

  #onItemClick = (e: Event) => {
    if (!this.#isMobile || !this.hasSubmenu) return;
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
      <div id="label">${this.label}<slot></slot></div>
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
