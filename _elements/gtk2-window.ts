import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ContextConsumer } from '@lit/context';
import { WMMinimizeEvent } from './gnome2-window-list.js';
import { activeWindowContext } from './gnome2-wm-context.js';
import styles from './gtk2-window.css';

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
  static styles = styles;

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
      <div data-cardinal="n" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="s" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="e" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="w" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="ne" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="nw" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="se" @pointerdown=${this.#onResizeStart}></div>
      <div data-cardinal="sw" @pointerdown=${this.#onResizeStart}></div>
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
          <a id="btn-close"
             aria-label="Close"
             href=${this.closeHref}
             @click=${this.#onClose}>
            <svg viewBox="0 0 10 10">
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
      if (path.some(el => (el as Element)?.closest?.('#titlebar-buttons'))) return;
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

    // Unfocused: raise immediately, defer the WMFocusEvent so the user can drag first
    if (unfocused) {
      this.#deferFocus = true;
      this.style.zIndex = '10000';
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
