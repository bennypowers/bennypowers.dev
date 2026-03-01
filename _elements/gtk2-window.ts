import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ContextConsumer } from '@lit/context';
import { WMMinimizeEvent } from './gnome2-window-list.js';
import { activeWindowContext } from './gnome2-wm-context.js';

export class WMFocusEvent extends Event {
  constructor(public url: string) {
    super('wm-focus', { bubbles: true, composed: true });
  }
}

export class WMCloseEvent extends Event {
  constructor(public url: string) {
    super('wm-close', { bubbles: true, composed: true });
  }
}

@customElement('gtk2-window')
export class Gtk2Window extends LitElement {
  static styles = css`
    [hidden] { display: none !important; }

    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      box-sizing: border-box;
      border-radius: var(--cl-window-radius, 6px);
      box-shadow: var(--cl-window-shadow, 2px 4px 12px rgba(0, 0, 0, 0.35));
      overflow: visible;
      background: var(--cl-window-bg, #f2f1f0);
      border: none;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      color: var(--cl-button-text, #2e3436);
    }

    :host([maximized]) {
      border-radius: 0;
      box-shadow: none;
      width: 100% !important;
      height: 100% !important;
      inset: 0 !important;
      margin: 0 !important;
      transform: none !important;
      max-height: none !important;
      #titlebar {
        border-radius: 0;
      }
    }

    :host(:not([focused])) {
      #titlebar {
        background: var(--cl-titlebar-bg-unfocused, linear-gradient(to bottom, #c0c0c0, #a0a0a0));
      }
      #title {
        color: var(--cl-titlebar-text-unfocused, #888a85);
        text-shadow: none;
      }
    }

    #titlebar {
      display: flex;
      align-items: center;
      height: var(--cl-titlebar-height, 24px);
      background: var(--cl-titlebar-bg, linear-gradient(to bottom, #729fcf, #3465a4));
      border-radius: var(--cl-titlebar-radius, 6px 6px 0 0);
      padding: 0 4px;
      user-select: none;
      cursor: default;
      border-bottom: 1px solid rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    #title {
      flex: 1;
      text-align: center;
      color: var(--cl-titlebar-text, #ffffff);
      text-shadow: var(--cl-titlebar-text-shadow, 0 1px 1px rgba(0, 0, 0, 0.4));
      font-size: var(--cl-font-size-title, 13px);
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: capitalize;
      white-space: nowrap;
      padding: 0 8px;
    }

    #window-icon {
      width: 16px;
      height: 16px;
      margin-inline-end: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 16px;
        height: 16px;
      }

      ::slotted(*) {
        width: 16px;
        height: 16px;
      }
    }

    :host(:not([icon])) #window-icon {
      display: none;
    }

    .titlebar-buttons {
      display: flex;
      gap: 2px;
      align-items: center;

      a, button {
        width: 18px;
        height: 18px;
        box-sizing: border-box;
        border-radius: 2px;
        border: 2px solid var(--cl-minmax-border, #6b7e95);
        background: var(--cl-minmax-bg, linear-gradient(to bottom, #93b3d3, #7a9bba));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 11px;
        line-height: 1;

        &:hover {
          background: var(--cl-minmax-bg-hover, linear-gradient(to bottom, #a3c3e3, #8aabca));
        }

        &:active {
          background: var(--cl-minmax-bg-active, linear-gradient(to bottom, #6a8ba8, #7a9bba));
        }

        svg {
          display: block;
          width: 10px;
          height: 10px;
        }
      }

      :host(:not([focused])) & a,
      :host(:not([focused])) & button {
        border-color: light-dark(#9d9c9b, #555555);
        background: linear-gradient(to bottom, light-dark(#fefefe, #444444), light-dark(#f0efee, #404040), light-dark(#e6e5e4, #3c3c3c), light-dark(#dadddb, #3a3a3a));
        color: light-dark(#888a85, #888a85);
      }
    }

    #body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    #menubar-area {
      --cl-panel-height: 22px;
      --_menubar-padding: 5px;
      --_menubar-mnemonic: underline;
      --_menubar-active-bg: var(--cl-titlebar-bg);
      --_menubar-active-text: var(--cl-titlebar-text, #ffffff);
      --_menubar-active-radius: var(--cl-button-radius, 3px) var(--cl-button-radius, 3px) 0 0;
      --_menu-icon-size: 16px;
      --_menu-icon-gap: 4px;
      --_menu-item-height: 22px;
      --_menu-font-size: 12px;
      --cl-menu-item-padding: 2px 12px 2px 4px;
      border-bottom: 2px solid light-dark(#d3d7cf, #555753);
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      flex-shrink: 0;

      ::slotted(gtk2-menu-bar) {
        height: 22px;
        font-size: var(--cl-font-size-small, 11px);
      }
    }

    #statusbar-area {
      border-top: 2px solid light-dark(#d3d7cf, #555753);
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      padding: 2px 8px;
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#555753, #babdb6);
      flex-shrink: 0;
      min-height: 18px;
    }

    :host([dialog]) #content-frame {
      border: none;
      margin: 0;
    }

    :host([dialog]) #content {
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
    }

    :host([dialog]) #statusbar-area {
      display: none;
    }

    #content-frame {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid light-dark(#9d9c9b, #555753);
      margin: 2px;
      margin-block-start: 0;
    }

    #content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: light-dark(#ffffff, #1a1a1a);
    }

    .resize {
      position: absolute;
      z-index: 10;
      &.n { top: -4px; left: 8px; right: 8px; height: 8px; cursor: n-resize; }
      &.s { bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: s-resize; }
      &.e { right: -4px; top: 8px; bottom: 8px; width: 8px; cursor: e-resize; }
      &.w { left: -4px; top: 8px; bottom: 8px; width: 8px; cursor: w-resize; }
      &.ne { top: -4px; right: -4px; width: 12px; height: 12px; cursor: ne-resize; }
      &.nw { top: -4px; left: -4px; width: 12px; height: 12px; cursor: nw-resize; }
      &.se { bottom: -4px; right: -4px; width: 12px; height: 12px; cursor: se-resize; }
      &.sw { bottom: -4px; left: -4px; width: 12px; height: 12px; cursor: sw-resize; }
    }

    :host([maximized]) .resize {
      display: none;
    }

    @media (max-width: 767px) {
      :host {
        border-radius: 0;
        box-shadow: none;
        border: none;
        width: 100% !important;
      }

      #titlebar {
        border-radius: 0;
      }

      .titlebar-button.minimize,
      .titlebar-button.maximize {
        display: none;
      }
    }
  `;

  @property({ reflect: true }) accessor label = '';
  @property({ reflect: true }) accessor icon = '';
  @property({ attribute: 'window-url', reflect: true }) accessor windowUrl = '';
  @property({ type: Boolean, reflect: true }) accessor maximized = false;
  @property({ type: Boolean, reflect: true }) accessor focused = false;
  @property({ type: Boolean, reflect: true }) accessor resizable = false;
  @property({ type: Boolean, reflect: true }) accessor dialog = false;
  @property({ attribute: 'close-href' }) accessor closeHref = '/';

  @state() accessor #offsetX = 0;
  @state() accessor #offsetY = 0;

  #activeWindow = new ContextConsumer(this, {
    context: activeWindowContext,
    subscribe: true,
    callback: (activeUrl) => {
      if (activeUrl !== undefined) {
        this.focused = this.windowUrl === activeUrl;
      }
    },
  });

  /** Resize snapshot — set in #onResizeStart, read in #onResizeMove */
  #resize: {
    cardinal: string;
    startX: number;
    startY: number;
    origRect: DOMRect;
    parentLeft: number;
    parentTop: number;
  } | null = null;

  get #iconSrc(): string {
    return this.icon ? `/assets/icons/gnome/${this.icon}.svg` : undefined;
  }

  render() {
    return html`
      <div class="resize n"  data-cardinal="n" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize s"  data-cardinal="s" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize e"  data-cardinal="e" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize w"  data-cardinal="w" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize ne" data-cardinal="ne" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize nw" data-cardinal="nw" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize se" data-cardinal="se" @pointerdown=${this.#onResizeStart}></div>
      <div class="resize sw" data-cardinal="sw" @pointerdown=${this.#onResizeStart}></div>
      <div id="titlebar"
           part="titlebar"
           @pointerdown=${this.#onTitlebarPointerDown}
           @dblclick=${this.#onTitlebarDblClick}>
        <div id="window-icon">
          <slot name="icon">
            <img src=${ifDefined(this.#iconSrc)}
                 role="presentation"
                 width="16"
                 height="16">
          </slot>
        </div>
        <div id="title">${this.label}</div>
        <div class="titlebar-buttons">
          <button class="titlebar-button minimize"
                  aria-label="Minimize"
                  @click=${this.#onMinimize}>
            <svg class="btn-icon" viewBox="0 0 10 10">
              <rect x="1" y="7" width="8" height="2" fill="currentColor"/>
            </svg>
          </button>
          <button class="titlebar-button maximize"
                  aria-label=${this.maximized ? 'Restore' : 'Maximize'}
                  @click=${this.#onMaximize}>
            <svg ?hidden="${!this.maximized}" class="btn-icon" viewBox="0 0 10 10">
              <rect x="1" y="1" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="1" y1="2" x2="7" y2="2" stroke="currentColor" stroke-width="1"/>
              <rect x="3" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="3" y1="4" x2="9" y2="4" stroke="currentColor" stroke-width="1"/>
            </svg>
            <svg ?hidden="${this.maximized}" class="btn-icon" viewBox="0 0 10 10">
              <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="1.5" y1="2.5" x2="8.5" y2="2.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <a class="titlebar-button close"
             aria-label="Close"
             href=${this.closeHref}
             @click=${this.#onClose}>
            <svg class="btn-icon" viewBox="0 0 10 10">
              <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" stroke-width="1.5"/>
              <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </a>
        </div>
      </div>
      <div id="body" part="body">
        <div id="menubar-area">
          <slot name="menubar"></slot>
        </div>
        <div id="content-frame">
          <div id="content" part="content">
            <slot></slot>
          </div>
          <div id="statusbar-area">
            <slot name="statusbar"></slot>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('pointerdown', this.#onHostPointerDown);
    window.addEventListener('resize', this.#onWindowResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this.#onHostPointerDown);
    window.removeEventListener('resize', this.#onWindowResize);
  }

  #onWindowResize = () => {
    if (this.maximized) return;
    const desktop = this.closest('gnome2-desktop');
    const workspace = desktop?.shadowRoot?.querySelector('#windows');
    if (!workspace) return;
    const workspaceTop = workspace.getBoundingClientRect().top;
    const rect = this.getBoundingClientRect();
    if (rect.top < workspaceTop) {
      // Push window down so titlebar is visible
      this.#offsetY += workspaceTop - rect.top;
      this.style.transform = `translate(${this.#offsetX}px, ${this.#offsetY}px)`;
    }
  };

  /** Set by #onTitlebarPointerDown to defer focus until pointerup (allows drag first). */
  #deferFocus = false;

  #onHostPointerDown(e: PointerEvent) {
    if (!this.focused && this.windowUrl) {
      if (this.#deferFocus) return;
      // Don't focus if clicking titlebar buttons (close/minimize/maximize)
      const path = e.composedPath();
      if (path.some(el => (el as Element)?.closest?.('.titlebar-button'))) return;
      this.dispatchEvent(new WMFocusEvent(this.windowUrl));
    }
  };

  #onMinimize() {
    if (this.windowUrl) {
      this.dispatchEvent(new WMMinimizeEvent(this.windowUrl));
    }
    this.dispatchEvent(new Event('minimize'));
  }

  #onMaximize() {
    this.maximized = !this.maximized;
    if (this.maximized) {
      this.#offsetX = 0;
      this.#offsetY = 0;
      this.style.transform = '';
    }
    this.dispatchEvent(new Event('maximize'));
  }

  #onTitlebarDblClick(e: MouseEvent) {
    if ((e.target as Element)?.closest('button, a')) return;
    this.#onMaximize();
  }

  #onClose(e: Event) {
    if (this.windowUrl) {
      e.preventDefault();
      this.dispatchEvent(new WMCloseEvent(this.windowUrl));
    }
    this.dispatchEvent(new Event('close'));
  }

  /** Capture pointer, call onMove per move, auto-cleanup on up/lost. */
  static #track(target: Element, pointerId: number, onMove: (ev: PointerEvent) => void) {
    target.setPointerCapture(pointerId);
    const cleanup = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', cleanup);
      target.removeEventListener('lostpointercapture', cleanup);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', cleanup);
    target.addEventListener('lostpointercapture', cleanup);
  }

  /** Drag snapshot — set in #onTitlebarPointerDown, read in #onDragMove */
  #drag: { startX: number; startY: number; minOffsetY: number } | null = null;

  #onTitlebarPointerDown(e: PointerEvent) {
    if ((e.target as Element)?.closest('button, a')) return;

    const unfocused = !this.focused && !!this.windowUrl;

    // Unfocused: defer the WMFocusEvent so the user can drag first
    if (unfocused) {
      this.#deferFocus = true;
      const titlebar = e.currentTarget as Element;
      const onUp = () => {
        this.#deferFocus = false;
        titlebar.removeEventListener('pointerup', onUp);
        titlebar.removeEventListener('lostpointercapture', onLost);
        this.dispatchEvent(new WMFocusEvent(this.windowUrl));
      };
      const onLost = () => {
        this.#deferFocus = false;
        titlebar.removeEventListener('pointerup', onUp);
        titlebar.removeEventListener('lostpointercapture', onLost);
      };
      titlebar.addEventListener('pointerup', onUp);
      titlebar.addEventListener('lostpointercapture', onLost);
    }

    if (this.maximized) return;
    // Find the workspace container (shadow DOM #windows div) to clamp drag bounds.
    // offsetParent doesn't work for slotted elements across shadow boundaries.
    const desktop = this.closest('gnome2-desktop');
    const workspace = desktop?.shadowRoot?.querySelector('#windows');
    const workspaceTop = workspace?.getBoundingClientRect().top ?? 0;
    const rect = this.getBoundingClientRect();
    const baseTop = rect.top - workspaceTop - this.#offsetY;
    this.#drag = {
      startX: e.clientX - this.#offsetX,
      startY: e.clientY - this.#offsetY,
      minOffsetY: -baseTop,
    };
    Gtk2Window.#track(e.currentTarget as Element, e.pointerId, this.#onDragMove);
  }

  #onDragMove = (ev: PointerEvent) => {
    if (!this.#drag) return;
    this.#offsetX = ev.clientX - this.#drag.startX;
    this.#offsetY = Math.max(this.#drag.minOffsetY, ev.clientY - this.#drag.startY);
    this.style.transform = `translate(${this.#offsetX}px, ${this.#offsetY}px)`;
  };

  #onResizeStart(e: PointerEvent) {
    if (this.maximized || !(e.currentTarget instanceof HTMLElement)) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = this.getBoundingClientRect();
    const parentRect = (this.offsetParent ?? this.parentElement)?.getBoundingClientRect()
      ?? { left: 0, top: 0 };

    // Pin to absolute position
    this.style.margin = '0';
    this.style.transform = 'none';
    this.style.insetInlineEnd = 'auto';
    this.style.insetInlineStart = `${rect.left - parentRect.left}px`;
    this.style.insetBlockStart = `${rect.top - parentRect.top}px`;
    this.style.width = `${rect.width}px`;
    this.style.height = `${rect.height}px`;
    this.#offsetX = 0;
    this.#offsetY = 0;

    this.#resize = {
      cardinal: e.currentTarget.dataset.cardinal ?? '',
      startX: e.clientX,
      startY: e.clientY,
      origRect: rect,
      parentLeft: parentRect.left,
      parentTop: parentRect.top,
    };

    Gtk2Window.#track(e.currentTarget, e.pointerId, this.#onResizeMove);
  }

  #onResizeMove = (ev: PointerEvent) => {
    const r = this.#resize;
    if (!r) return;
    const dx = ev.clientX - r.startX;
    const dy = ev.clientY - r.startY;
    const minW = 200;
    const minH = 100;

    if (r.cardinal.includes('e')) {
      this.style.width = `${Math.max(minW, r.origRect.width + dx)}px`;
    }
    if (r.cardinal.includes('w')) {
      const w = Math.max(minW, r.origRect.width - dx);
      this.style.insetInlineStart = `${r.origRect.left - r.parentLeft + (r.origRect.width - w)}px`;
      this.style.width = `${w}px`;
    }
    if (r.cardinal.includes('s')) {
      this.style.height = `${Math.max(minH, r.origRect.height + dy)}px`;
    }
    if (r.cardinal.includes('n')) {
      const h = Math.max(minH, r.origRect.height - dy);
      this.style.insetBlockStart = `${r.origRect.top - r.parentTop + (r.origRect.height - h)}px`;
      this.style.height = `${h}px`;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-window': Gtk2Window;
  }
}
