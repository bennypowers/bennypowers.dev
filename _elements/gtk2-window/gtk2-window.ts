import { LitElement, html, isServer } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';
import { WMEvent } from '../lib/wm-event.js';
import { activeWindowContext } from '../gnome2-wm-context/gnome2-wm-context.js';
import styles from './gtk2-window.css';

export { WMEvent } from '../lib/wm-event.js';

/**
 * A draggable, resizable window modeled after Metacity 2.20. Provides
 * titlebar with minimize/maximize/close, drag-to-move, and edge-resize.
 * MUST be placed inside `gnome2-desktop` for WM integration. Consumes
 * `activeWindowContext` to track focus state.
 *
 * @summary Metacity-style draggable, resizable application window
 *
 * @fires {WMEvent} wm-event - focus: When focus is requested. Detail: `wmId`, `url`.
 * @fires {WMEvent} wm-event - close: When the close button is clicked. Detail: `wmId`, `url`.
 * @fires {WMEvent} wm-event - move: After drag or resize ends. Detail: `wmId`, `url`.
 * @fires minimize - When the minimize button is clicked. No detail.
 * @fires maximize - When maximize is toggled. No detail.
 * @fires close - When the close button is clicked. No detail.
 */
@customElement('gtk2-window')
export class Gtk2Window extends LitElement {
  static styles = styles;

  /** Window title displayed in the titlebar */
  @property({ reflect: true }) accessor label = '';

  /** Icon path relative to /assets/icons/gnome/, e.g. `apps/calculator` */
  @property({ reflect: true }) accessor icon = '';

  /** Unique window manager identifier. Defaults to `window-url` if not set. */
  @property({ attribute: 'wm-id', reflect: true }) accessor wmId = '';

  /** URL of the page content displayed in this window */
  @property({ attribute: 'window-url' }) accessor windowUrl = '';

  /** Whether the window fills the workspace. Toggle via titlebar double-click. */
  @property({ type: Boolean, reflect: true }) accessor maximized = false;

  /** Whether this window has focus. Managed by `gnome2-desktop` via context. */
  @property({ type: Boolean, reflect: true }) accessor focused = false;

  /** Whether edge-resize handles are active */
  @property({ type: Boolean, reflect: true }) accessor resizable = false;

  /** Dialog mode: hides statusbar and uses dialog sizing */
  @property({ type: Boolean, reflect: true }) accessor dialog = false;

  /** URL to navigate to when the window is closed */
  @property({ attribute: 'close-href' }) accessor closeHref = '/';

  @consume({ context: activeWindowContext, subscribe: true })
  @state()
  accessor activeWmId: string | undefined = undefined;

  @state() accessor #offsetX = 0;
  @state() accessor #offsetY = 0;

  protected override willUpdate(): void {
    if (!this.wmId && this.windowUrl) {
      this.wmId = this.windowUrl;
    }
    if (this.activeWmId !== undefined) {
      this.focused = this.wmId === this.activeWmId;
    }
  }

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
      <div data-cardinal="n" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="s" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="e" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="w" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="ne" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="nw" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="se" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="sw" @pointerdown=${this.#onResizeStart}></div>
      <!-- The Metacity-style titlebar. Use to override background gradient or height. -->
      <div id="titlebar"
           part="titlebar"
           @pointerdown=${this.#onTitlebarPointerDown}
           @dblclick=${this.#onTitlebarDblClick}>
        <div id="window-icon">
          <!-- Custom window icon element, typically an img or svg. SHOULD be 16x16. MUST have role="presentation" or alt text. Falls back to the icon attribute. -->
          <slot name="icon">
            <img src=${ifDefined(this.#iconSrc)}
                 role="presentation"
                 width="16"
                 height="16">
          </slot>
        </div>
        <div id="title">${this.label}</div>
        <div id="titlebar-buttons">
          <button id="btn-minimize"
                  aria-label="Minimize"
                  @click=${this.#onMinimize}>
            <svg viewBox="0 0 10 10">
              <rect x="1" y="7" width="8" height="2" fill="currentColor"/>
            </svg>
          </button>
          <button id="btn-maximize"
                  aria-label=${this.maximized ? 'Restore' : 'Maximize'}
                  @click=${this.#onMaximize}>
            <svg ?hidden="${!this.maximized}" viewBox="0 0 10 10">
              <rect x="1" y="1" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="1" y1="2" x2="7" y2="2" stroke="currentColor" stroke-width="1"/>
              <rect x="3" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="3" y1="4" x2="9" y2="4" stroke="currentColor" stroke-width="1"/>
            </svg>
            <svg ?hidden="${this.maximized}" viewBox="0 0 10 10">
              <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/>
              <line x1="1.5" y1="2.5" x2="8.5" y2="2.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button id="btn-close"
                  aria-label="Close"
                  @click=${this.#onClose}>
            <svg viewBox="0 0 10 10">
              <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" stroke-width="1.5"/>
              <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- The window body below the titlebar. Contains menubar, content, and statusbar areas. -->
      <div id="body" part="body">
        <div id="menubar-area">
          <!-- A gtk2-menu-bar element for the window's menu bar. Provides keyboard-navigable menus. Renders below the titlebar. -->
          <slot name="menubar"></slot>
        </div>
        <div id="content-frame">
          <!-- The main content area. Background is white/dark by default. Use for custom content backgrounds. -->
          <div id="content" part="content">
            <!-- Main window content. Typically contains the application element or page content. -->
            <slot></slot>
          </div>
          <div id="statusbar-area">
            <!-- Status bar content rendered at the bottom of the window. Hidden when dialog attribute is set. -->
            <slot name="statusbar"></slot>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.addEventListener('pointerdown', this.#onHostPointerDown);
    window.addEventListener('resize', this.#onWindowResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
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

  #onHostPointerDown(e: PointerEvent) {
    if (!this.wmId || this.focused) return;
    // Don't focus if clicking titlebar buttons (close/minimize/maximize)
    const path = e.composedPath();
    if (path.some(el => (el as Element)?.closest?.('#titlebar-buttons'))) return;
    this.dispatchEvent(new WMEvent('focus', this.wmId, this.windowUrl));
  };

  #onMinimize() {
    if (this.wmId) {
      this.dispatchEvent(new WMEvent('minimize', this.wmId, this.windowUrl));
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

  #onClose() {
    if (this.wmId) {
      this.dispatchEvent(new WMEvent('close', this.wmId, this.windowUrl));
    }
    this.dispatchEvent(new Event('close'));
  }

  /** Capture pointer, call onMove per move, auto-cleanup on up/lost. */
  static #track(target: Element, pointerId: number, onMove: (ev: PointerEvent) => void, onEnd?: () => void) {
    target.setPointerCapture(pointerId);
    const cleanup = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', cleanup);
      target.removeEventListener('lostpointercapture', cleanup);
      onEnd?.();
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', cleanup);
    target.addEventListener('lostpointercapture', cleanup);
  }

  /** Drag snapshot — set in #onTitlebarPointerDown, read in #onDragMove */
  #drag: { startX: number; startY: number; minOffsetY: number } | null = null;

  #onTitlebarPointerDown(e: PointerEvent) {
    if ((e.target as Element)?.closest('button, a')) return;

    // Focus immediately on titlebar grab
    if (!this.focused && this.wmId) {
      this.dispatchEvent(new WMEvent('focus', this.wmId, this.windowUrl));
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
    Gtk2Window.#track(e.currentTarget as Element, e.pointerId, this.#onDragMove, this.#onMoveEnd);
  }

  #onMoveEnd = () => {
    if (this.wmId) {
      this.dispatchEvent(new WMEvent('move', this.wmId, this.windowUrl));
    }
  };

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

    Gtk2Window.#track(e.currentTarget, e.pointerId, this.#onResizeMove, this.#onMoveEnd);
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
