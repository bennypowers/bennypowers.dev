import type { Gtk2Window } from '../gtk2-window/gtk2-window.js';

import { LitElement, html, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import styles from './gnome2-desktop.css';

import { activeWindowContext, taskbarContext, type TaskbarEntry } from '../gnome2-wm-context/gnome2-wm-context.js';
import { getApp, getAppModule, getAllAppIds } from '../lib/app-registry.js';
import { WMController } from '../lib/wm-controller.js';
import { SPAController, vtName, fetchWindowContent } from '../lib/spa-controller.js';

/**
 * Root window manager for the GNOME 2.20 desktop shell. MUST be
 * the outermost layout element. Provides Metacity-style cascade
 * placement, workspace switching, minimize/restore/close, and
 * session persistence for managed `gtk2-window` elements.
 *
 * @summary GNOME 2 desktop shell and Metacity window manager
 */
@customElement('gnome2-desktop')
export class Gnome2Desktop extends LitElement {
  static styles = styles;

  @provide({ context: activeWindowContext })
  @property({ attribute: false })
  accessor activeWindow: string | undefined = undefined;

  @provide({ context: taskbarContext })
  @property({ attribute: false })
  accessor taskbarEntries: TaskbarEntry[] = [];

  /** URL of the current page, used to initialize the active window during SSR */
  @property({ attribute: 'page-url' }) accessor pageUrl = '';

  /** Title of the current page, used for the initial taskbar entry */
  @property({ attribute: 'page-title' }) accessor pageTitle = '';

  /** Icon path for the current page window */
  @property({ attribute: 'page-icon' }) accessor pageIcon = '';

  /** Window manager controller */
  readonly wm = new WMController(this, {
    onActiveWindowChange: (id) => { this.activeWindow = id; },
    onTaskbarChange: (entries) => { this.taskbarEntries = entries; },
  });

  /** SPA navigation controller */
  readonly spa = new SPAController(this, { wm: this.wm });

  // ─── App launcher ─────────────────────────────────────────────

  async launchApp(id: string, { focus = true } = {}) {
    const module = getAppModule(id);
    if (!module) return;
    const wmId = `app:${id}`;

    const existingEl = this.wm.findWindowElement(wmId);

    if (existingEl) {
      existingEl.style.display = '';
      const def = getApp(id);
      if (def && !existingEl.querySelector(def.tag)) {
        await import(module);
        const child = document.createElement(def.tag);
        if (def.attrs) {
          for (const [k, v] of Object.entries(def.attrs())) child.setAttribute(k, v);
        }
        existingEl.appendChild(child);
      }
      if (focus) this.wm.focusWindow(wmId);
      else this.wm.sync();
      return;
    }

    await import(module);
    const def = getApp(id);
    if (!def) return;
    const workspace = this.wm.getActiveWorkspace();
    const win = document.createElement('gtk2-window') as Gtk2Window;
    win.setAttribute('label', def.label);
    win.setAttribute('icon', def.icon);
    win.setAttribute('dialog', '');
    win.setAttribute('data-app', id);
    win.setAttribute('window-url', `app:${id}`);
    win.setAttribute('data-workspace', String(workspace));
    win.style.width = def.width;
    win.style.height = def.height;
    win.style.position = 'absolute';
    win.style.insetBlockStart = '40px';
    win.style.insetInlineEnd = '40px';
    const child = document.createElement(def.tag);
    if (def.attrs) {
      for (const [k, v] of Object.entries(def.attrs())) child.setAttribute(k, v);
    }
    win.appendChild(child);
    win.style.viewTransitionName = vtName(wmId);
    this.appendChild(win);

    this.wm.registerWindow(wmId, {
      url: `app:${id}`,
      title: def.label,
      icon: def.icon,
      minimized: false,
      maximized: false,
      workspace,
      appId: id,
    });

    if (focus) this.wm.focusWindow(wmId);
    else this.wm.sync();

    try { sessionStorage.setItem(`app-${id}`, '1'); } catch {}
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  protected override willUpdate(): void {
    if (!this.wm.activeId) {
      this.wm.activeId = isServer ? this.pageUrl : (this.pageUrl || location.pathname);
      this.activeWindow = this.wm.activeId;
      if (this.wm.activeId) {
        this.taskbarEntries = [{
          id: this.wm.activeId,
          url: this.wm.activeId,
          title: this.pageTitle || '',
          icon: this.pageIcon || undefined,
          focused: true,
          minimized: false,
        }];
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    if (isServer) return;

    this.wm.isMobile = matchMedia('(max-width: 767px)').matches;

    const currentWindow = this.querySelector<Gtk2Window>('gtk2-window');
    if (currentWindow) {
      if (!currentWindow.windowUrl) {
        currentWindow.windowUrl = this.wm.activeId ?? location.pathname;
      }
      currentWindow.style.viewTransitionName = vtName(
        this.wm.activeId ?? location.pathname,
      );
    }

    // WM controller registers its own wm-event listener via hostConnected

    requestAnimationFrame(() => this.#boot());
  }

  #boot() {
    this.wm.booted = true;
    const activeId = this.wm.activeId ?? location.pathname;
    this.wm.activeId = activeId;

    this.wm.windows = this.wm.loadWindows();

    const currentWindow = this.querySelector<Gtk2Window>('gtk2-window');
    if (currentWindow) {
      this.wm.registerWindow(activeId, {
        url: activeId,
        title: currentWindow.label || document.title,
        icon: currentWindow.icon || undefined,
        minimized: false,
        maximized: currentWindow.maximized,
        workspace: this.wm.getActiveWorkspace(),
        closeHref: currentWindow.closeHref,
      });

      if (!this.wm.isMobile) {
        this.wm.placeWindow(currentWindow, activeId);
      }
    }

    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      if (win === currentWindow) continue;
      const id = win.wmId || win.windowUrl;
      if (!id) continue;
      this.wm.registerWindow(id, {
        url: win.windowUrl,
        title: win.label || '',
        icon: win.icon || undefined,
        minimized: false,
        maximized: win.maximized,
        workspace: this.wm.getActiveWorkspace(),
        appId: win.dataset.app,
      });
    }

    try {
      for (const id of getAllAppIds()) {
        if (sessionStorage.getItem(`app-${id}`)) this.launchApp(id, { focus: false });
      }
    } catch {}

    this.wm.focusWindow(activeId, { animate: false });

    if (this.wm.isMobile) return;

    // ── Desktop-only initialization ──

    const activeWorkspace = this.wm.getActiveWorkspace();
    const currentState = this.wm.windows.get(activeId);
    if (currentState && currentState.workspace !== activeWorkspace) {
      this.wm.saveActiveWorkspace(currentState.workspace);
    }

    // Fetch and inject background windows (parallel)
    (async () => {
      const entries = [...this.wm.windows].filter(([id]) =>
        id !== activeId && !this.wm.findWindowElement(id)
      );

      await Promise.all(entries.map(async ([id, state]) => {
        if (state.url?.startsWith('pidgin:')) {
          this.wm.unregisterWindow(id);
          return;
        }

        const sourceWindow = await fetchWindowContent(state.url);
        if (!sourceWindow) {
          this.wm.unregisterWindow(id);
          return;
        }

        const windowEl = document.createElement('gtk2-window') as Gtk2Window;
        windowEl.label = state.title;
        windowEl.windowUrl = state.url;
        windowEl.closeHref = state.closeHref || '/';
        windowEl.style.viewTransitionName = vtName(state.url);
        if (state.icon) windowEl.icon = state.icon;
        windowEl.innerHTML = sourceWindow.innerHTML;

        if (state.minimized || state.workspace !== this.wm.getActiveWorkspace()) {
          windowEl.style.display = 'none';
        }

        this.appendChild(windowEl);
      }));

      this.wm.positionBackgroundWindows();
      this.wm.sync();
    })();

    document.getElementById('gnome2-wm-initial-pos')?.remove();

    this.spa.attach();

    this.addEventListener('gotpointercapture', this.wm.onGotPointerCapture, true);
    this.addEventListener('lostpointercapture', this.wm.onLostPointerCapture, true);
    this.addEventListener('pointermove', this.wm.onPointerMove, true);
    this.addEventListener('maximize', this.wm.onMaximize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.spa.detach();

    this.removeEventListener('gotpointercapture', this.wm.onGotPointerCapture, true);
    this.removeEventListener('lostpointercapture', this.wm.onLostPointerCapture, true);
    this.removeEventListener('pointermove', this.wm.onPointerMove, true);
    this.removeEventListener('maximize', this.wm.onMaximize);
  }

  render() {
    return html`
      <!-- A gnome2-panel element for the top panel. MUST contain navigation landmarks for screen reader users. -->
      <slot name="top-panel"></slot>
      <!-- The desktop workspace area between panels. Contains icons and floating windows. -->
      <div id="workspace" part="workspace" role="main">
        <div id="icons">
          <!-- Desktop icon elements (desktop-icon) displayed in column flow. Each icon SHOULD have a meaningful label for accessibility. -->
          <slot name="icons"></slot>
        </div>
        <div id="windows">
          <!-- gtk2-window elements managed by the window manager. Each window provides its own focus management and ARIA roles. -->
          <slot></slot>
        </div>
      </div>
      <!-- A gnome2-panel element for the bottom panel. SHOULD contain gnome2-window-list for keyboard-accessible window switching. -->
      <slot name="bottom-panel"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-desktop': Gnome2Desktop;
  }
}
