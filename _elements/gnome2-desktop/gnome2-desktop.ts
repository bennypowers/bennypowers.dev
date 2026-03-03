import type { WMFocusEvent, WMCloseEvent, Gtk2Window } from '../gtk2-window/gtk2-window.js';
import type { WMMinimizeEvent, WMRestoreEvent, WMShowDesktopEvent } from '../gnome2-window-list/gnome2-window-list.js';
import type { WMWorkspaceSwitchEvent, MiniWindow } from '../gnome2-workspace-switcher/gnome2-workspace-switcher.js';

import { LitElement, html, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import styles from './gnome2-desktop.css';

import { activeWindowContext, taskbarContext, type WindowEntry, type TaskbarEntry } from '../gnome2-wm-context/gnome2-wm-context.js';

const STORAGE_KEY = 'gnome2-wm-windows';
const WORKSPACE_KEY = 'gnome2-wm-workspace';

// Metacity 2.20 cascade constants (src/place.c)
const CASCADE_INTERVAL = 50;
const CASCADE_FUZZ = 15;

interface AppDef {
  module: string;
  tag: string;
  label: string;
  icon: string;
  width: string;
  height: string;
  attrs?: () => Record<string, string>;
}

const APP_DEFS: Record<string, AppDef> = {
  calculator: {
    module: 'gnome2/gnome2-calculator/gnome2-calculator.js',
    tag: 'gnome2-calculator',
    label: 'Calculator',
    icon: 'apps/accessories-calculator',
    width: '260px',
    height: '320px',
  },
  mines: {
    module: 'gnome2/gnome2-mines/gnome2-mines.js',
    tag: 'gnome2-mines',
    label: 'Mines',
    icon: 'categories/applications-games',
    width: '280px',
    height: '360px',
  },
  supertux: {
    module: 'gnome2/gnome2-supertux/gnome2-supertux.js',
    tag: 'gnome2-supertux',
    label: 'SuperTux',
    icon: 'apps/supertux',
    width: '800px',
    height: '600px',
  },
  about: {
    module: 'gnome2/gnome2-about/gnome2-about.js',
    tag: 'gnome2-about',
    label: 'About bennypowers.dev',
    icon: 'status/dialog-information',
    width: '550px',
    height: '500px',
  },
  pidgin: {
    module: 'gnome2/pidgin-conversation/pidgin-conversation.js',
    tag: 'pidgin-conversation',
    label: 'Conversation',
    icon: 'apps/internet-group-chat',
    width: '450px',
    height: '400px',
    attrs: () => ({ 'post-url': `https://bennypowers.dev${location.pathname}` }),
  },
};

/** Internal state for a single managed window. */
interface WMWindowState {
  id: string;
  url: string;
  title: string;
  icon?: string;
  minimized: boolean;
  maximized: boolean;
  workspace: number;
  position?: { x: number; y: number; width: number; height: number };
  closeHref?: string;
  appId?: string;
}

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

  /** Centralized window state keyed by wmId. */
  #windows = new Map<string, WMWindowState>();
  #activeId: string | null = null;
  #isMobile = false;
  #booted = false;
  #tracking = false;
  #topZ = 100;
  #rafId = 0;

  // ─── DOM helpers ──────────────────────────────────────────────

  /** Find a gtk2-window element by its wmId (or windowUrl fallback). */
  #findWindowElement(id: string): Gtk2Window | null {
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      if (win.wmId === id || win.windowUrl === id) return win;
    }
    return null;
  }

  // ─── Storage ──────────────────────────────────────────────────

  #getActiveWorkspace(): number {
    try {
      return parseInt(sessionStorage.getItem(WORKSPACE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  #saveActiveWorkspace(index: number) {
    try {
      sessionStorage.setItem(WORKSPACE_KEY, String(index));
    } catch {}
  }

  /** Deserialize sessionStorage into the window Map. */
  #loadWindows(): Map<string, WMWindowState> {
    try {
      const raw: WindowEntry[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      const map = new Map<string, WMWindowState>();
      for (const e of raw) {
        const id = e.id ?? e.url ?? '';
        map.set(id, {
          id,
          url: e.url ?? '',
          title: e.title,
          icon: e.icon,
          minimized: e.minimized,
          maximized: e.maximized ?? false,
          workspace: e.workspace ?? 0,
          position: (e.x != null && e.y != null)
            ? { x: e.x, y: Math.max(0, e.y), width: e.width ?? 0, height: e.height ?? 0 }
            : undefined,
          closeHref: e.closeHref,
          appId: e.appId,
        });
      }
      return map;
    } catch {
      return new Map();
    }
  }

  /** Serialize the window Map back to sessionStorage. */
  #saveWindows() {
    try {
      const arr = [...this.#windows.values()].map(w => ({
        id: w.id,
        url: w.url,
        title: w.title,
        icon: w.icon,
        minimized: w.minimized,
        maximized: w.maximized,
        workspace: w.workspace,
        x: w.position?.x,
        y: w.position?.y,
        width: w.position?.width,
        height: w.position?.height,
        closeHref: w.closeHref,
        appId: w.appId,
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {}
  }

  // ─── State machine ────────────────────────────────────────────

  /** Add or update a window in the state map. */
  #registerWindow(id: string, state: Omit<WMWindowState, 'id'>): WMWindowState {
    const existing = this.#windows.get(id);
    if (existing) {
      existing.title = state.title;
      existing.minimized = false;
      if (state.icon) existing.icon = state.icon;
      if (state.closeHref) existing.closeHref = state.closeHref;
    } else {
      this.#windows.set(id, { ...state, id });
    }
    this.#saveWindows();
    return this.#windows.get(id)!;
  }

  /** Remove a window from the state map. */
  #unregisterWindow(id: string) {
    this.#windows.delete(id);
    this.#saveWindows();
  }

  /** Focus a window: raise it, unminimize, update context. */
  #focusWindow(id: string, { animate = true } = {}) {
    const state = this.#windows.get(id);
    if (state?.minimized) {
      state.minimized = false;
      this.#saveWindows();
    }

    if (!this.#isMobile) {
      this.#pinFocusedWindows(id);
    }

    this.#activeId = id;

    const el = this.#findWindowElement(id);
    if (el) {
      el.style.display = '';
      el.style.zIndex = String(++this.#topZ);
    }

    const update = () => { this.activeWindow = id; };
    if (animate && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      update();
    }

    this.#sync();
  }

  /** Toggle the minimized state of a window. */
  #toggleMinimize(id: string) {
    const state = this.#windows.get(id);
    const el = this.#findWindowElement(id);
    if (state) {
      state.minimized = !state.minimized;
      this.#saveWindows();
      if (el) el.style.display = state.minimized ? 'none' : '';
      if (this.#isMobile && !state.minimized) {
        this.#activeId = id;
        this.activeWindow = id;
      }
    }
    this.#sync();
  }

  /** Recompute derived state: taskbar entries, miniatures. */
  #sync() {
    if (!this.#booted) return;
    this.#updateTaskbar();
    if (!this.#isMobile) this.#syncMiniatures();
  }

  // ─── Position helpers ─────────────────────────────────────────

  #savePositions() {
    const workspace = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = workspace.getBoundingClientRect();
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.#windows.get(id);
      if (!state) continue;
      const rect = win.getBoundingClientRect();
      state.position = {
        x: rect.left - parentRect.left,
        y: Math.max(0, rect.top - parentRect.top),
        width: rect.width,
        height: rect.height,
      };
      state.maximized = win.maximized;
    }
    this.#saveWindows();
  }

  static #applyPosition(win: HTMLElement, state: WMWindowState) {
    if (state.maximized) {
      win.setAttribute('maximized', '');
      return;
    }
    if (state.position) {
      win.style.insetBlockStart = `${Math.max(0, state.position.y)}px`;
      win.style.insetInlineStart = `${state.position.x}px`;
      win.style.margin = '0';
      if (state.position.width) win.style.width = `${state.position.width}px`;
      if (state.position.height) win.style.height = `${state.position.height}px`;
    }
  }

  /** Metacity-style placement: saved position → center if no overlap → cascade. */
  #placeWindow(win: HTMLElement, id: string) {
    const state = this.#windows.get(id);
    if (state?.position) {
      Gnome2Desktop.#applyPosition(win, state);
      return;
    }
    const container = this.shadowRoot?.querySelector('#windows');
    const workRect = container?.getBoundingClientRect() ?? { width: 840, height: 560 };
    const winW = parseFloat(win.style.width) || Math.min(workRect.width * 0.9, 840);
    const winH = parseFloat(win.style.height) || Math.min(workRect.height * 0.8, 560);
    const cx = Math.max(0, (workRect.width - winW) / 2);
    const cy = 16;
    if (!this.#overlapsAnyWindow(cx, cy, winW, winH)) {
      win.style.insetBlockStart = `${cy}px`;
      win.style.insetInlineStart = `${cx}px`;
      win.style.margin = '0';
      return;
    }
    const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
    win.style.insetBlockStart = `${Math.max(0, pos.y)}px`;
    win.style.insetInlineStart = `${pos.x}px`;
    win.style.margin = '0';
  }

  #overlapsAnyWindow(x: number, y: number, w: number, h: number): boolean {
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    for (const win of this.querySelectorAll('gtk2-window')) {
      if (win.style.display === 'none') continue;
      const rect = win.getBoundingClientRect();
      const wx = rect.left - parentRect.left;
      const wy = rect.top - parentRect.top;
      if (x < wx + rect.width && x + w > wx && y < wy + rect.height && y + h > wy) {
        return true;
      }
    }
    return false;
  }

  #findNextCascade(workW: number, workH: number, winW: number, winH: number): { x: number; y: number } {
    const positions: { x: number; y: number }[] = [];
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    for (const win of this.querySelectorAll('gtk2-window')) {
      if (win.style.display === 'none') continue;
      const rect = win.getBoundingClientRect();
      positions.push({ x: rect.left - parentRect.left, y: rect.top - parentRect.top });
    }
    positions.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    let cx = 0;
    let cy = 0;
    let stage = 0;

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (Math.abs(p.x - cx) < CASCADE_FUZZ && Math.abs(p.y - cy) < CASCADE_FUZZ) {
        cx = p.x + CASCADE_INTERVAL;
        cy = p.y + CASCADE_INTERVAL;

        if (cx + winW > workW || cy + winH > workH) {
          stage++;
          cx = CASCADE_INTERVAL * stage;
          cy = 0;
          i = -1;
        }
      }
    }

    return { x: cx, y: cy };
  }

  #positionBackgroundWindows() {
    const activeWorkspace = this.#getActiveWorkspace();
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const workRect = container.getBoundingClientRect();
    let bgIndex = 0;
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.#windows.get(id);

      if (state?.appId) continue;

      if (state && state.workspace !== activeWorkspace) {
        win.style.display = 'none';
        continue;
      }

      if (id === this.#activeId) {
        win.style.zIndex = String(this.#topZ);
        if (state?.position) {
          Gnome2Desktop.#applyPosition(win, state);
        }
      } else {
        win.style.zIndex = String(bgIndex + 1);
        if (state?.position) {
          Gnome2Desktop.#applyPosition(win, state);
        } else {
          const winW = parseFloat(win.style.width) || 840;
          const winH = parseFloat(win.style.height) || 560;
          const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
          win.style.insetBlockStart = `${Math.max(0, pos.y)}px`;
          win.style.insetInlineStart = `${pos.x}px`;
          win.style.margin = '0';
        }
        bgIndex++;
      }
    }
  }

  /** Generate a CSS-safe view-transition-name from a window URL. */
  static #vtName(url: string) {
    return `wm-${url.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  // ─── Active window management ─────────────────────────────────

  /** Pin currently-focused windows to absolute position (before switching focus).
   *  @param excludeId  The window about to receive focus — skip it. */
  #pinFocusedWindows(excludeId?: string) {
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    for (const w of this.querySelectorAll<Gtk2Window>('gtk2-window[focused]')) {
      const id = w.wmId || w.windowUrl;
      if (id === excludeId) continue;
      const rect = w.getBoundingClientRect();
      const tx = new DOMMatrix(getComputedStyle(w).transform);
      w.style.insetBlockStart = `${Math.max(0, rect.top - parentRect.top - tx.m42)}px`;
      w.style.insetInlineStart = `${rect.left - parentRect.left - tx.m41}px`;
      w.style.margin = '0';
    }
  }

  // ─── Taskbar + miniatures ─────────────────────────────────────

  #updateTaskbar() {
    const activeWorkspace = this.#getActiveWorkspace();
    const taskbarEntries: TaskbarEntry[] = [];
    for (const [id, state] of this.#windows) {
      if (state.workspace !== activeWorkspace) continue;
      taskbarEntries.push({
        id,
        url: state.url,
        title: state.title,
        icon: state.icon,
        focused: id === this.#activeId,
        minimized: state.minimized,
      });
    }
    this.taskbarEntries = taskbarEntries;
  }

  #syncMiniatures() {
    const switcher = document.querySelector('gnome2-workspace-switcher');
    if (!switcher) return;
    const activeWs = this.#getActiveWorkspace();
    switcher.active = activeWs;

    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    const dw = parentRect.width || 1;
    const dh = parentRect.height || 1;

    const minis: MiniWindow[] = [];
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.#windows.get(id);
      const workspace = state?.workspace ?? 0;
      const minimized = state?.minimized ?? false;

      if (win.style.display === 'none') {
        if (state?.position && state.position.width && state.position.height) {
          minis.push({
            workspace,
            x: Math.max(0, state.position.x / dw),
            y: Math.max(0, state.position.y / dh),
            w: state.position.width / dw,
            h: state.position.height / dh,
            minimized,
          });
        } else {
          const w = parseFloat(win.style.width) || 200;
          const h = parseFloat(win.style.height) || 150;
          const x = parseFloat(win.style.insetInlineStart) || parseFloat(win.style.insetInlineEnd) || 40;
          const y = parseFloat(win.style.insetBlockStart) || 40;
          minis.push({ workspace, x: x / dw, y: y / dh, w: w / dw, h: h / dh, minimized });
        }
        continue;
      }

      const rect = win.getBoundingClientRect();
      minis.push({
        workspace,
        x: Math.max(0, (rect.left - parentRect.left) / dw),
        y: Math.max(0, (rect.top - parentRect.top) / dh),
        w: rect.width / dw,
        h: rect.height / dh,
        minimized,
      });
    }
    switcher.windows = minis;
  }

  // ─── Workspace visibility ─────────────────────────────────────

  #applyWorkspaceVisibility() {
    const activeWorkspace = this.#getActiveWorkspace();
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.#windows.get(id);
      if (!state) continue;
      if (state.workspace !== activeWorkspace) {
        win.style.display = 'none';
      } else if (state.minimized) {
        win.style.display = 'none';
      } else {
        win.style.display = '';
      }
    }
  }

  // ─── Fetch + inject ───────────────────────────────────────────

  static async #fetchWindowContent(url: string): Promise<Element | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const sourceWindow = doc.querySelector('gtk2-window');
      if (!sourceWindow) return null;
      for (const script of sourceWindow.querySelectorAll('script')) {
        script.remove();
      }
      return sourceWindow;
    } catch {
      return null;
    }
  }

  // ─── SPA window navigation ────────────────────────────────────

  async #openWindow(url: string) {
    const wmId = url;
    const existing = this.#findWindowElement(wmId);
    if (existing) {
      this.#focusWindow(wmId);
      history.pushState(null, '', url);
      return;
    }

    const sourceWindow = await Gnome2Desktop.#fetchWindowContent(url);
    if (!sourceWindow) {
      this.#savePositions();
      location.href = url;
      return;
    }

    const title = sourceWindow.getAttribute('label') || url;
    const icon = sourceWindow.getAttribute('icon') || undefined;
    const closeHref = sourceWindow.getAttribute('close-href') || '/';

    if (!this.#isMobile) {
      this.#pinFocusedWindows();
    }

    this.#registerWindow(wmId, {
      url,
      title,
      icon,
      minimized: false,
      maximized: false,
      workspace: this.#getActiveWorkspace(),
      closeHref,
    });

    const windowEl = document.createElement('gtk2-window') as Gtk2Window;
    windowEl.label = title;
    windowEl.windowUrl = url;
    windowEl.closeHref = closeHref;
    windowEl.style.viewTransitionName = Gnome2Desktop.#vtName(url);
    if (icon) windowEl.icon = icon;
    windowEl.innerHTML = sourceWindow.innerHTML;

    this.#placeWindow(windowEl, wmId);
    this.appendChild(windowEl);

    this.#focusWindow(wmId, { animate: false });

    history.pushState(null, '', url);
  }

  // ─── App launcher ─────────────────────────────────────────────

  async launchApp(id: string, { focus = true } = {}) {
    const def = APP_DEFS[id];
    if (!def) return;
    const wmId = `app:${id}`;

    const existingEl = this.#findWindowElement(wmId);

    if (existingEl) {
      existingEl.style.display = '';
      if (!existingEl.querySelector(def.tag)) {
        await import(def.module);
        const child = document.createElement(def.tag);
        if (def.attrs) {
          for (const [k, v] of Object.entries(def.attrs())) child.setAttribute(k, v);
        }
        existingEl.appendChild(child);
      }
      if (focus) this.#focusWindow(wmId);
      else this.#sync();
      return;
    }

    await import(def.module);
    const workspace = this.#getActiveWorkspace();
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
    win.style.viewTransitionName = Gnome2Desktop.#vtName(wmId);
    this.appendChild(win);

    this.#registerWindow(wmId, {
      url: `app:${id}`,
      title: def.label,
      icon: def.icon,
      minimized: false,
      maximized: false,
      workspace,
      appId: id,
    });

    if (focus) this.#focusWindow(wmId);
    else this.#sync();

    try { sessionStorage.setItem(`app-${id}`, '1'); } catch {}
  }

  // ─── WM Event Handlers ───────────────────────────────────────

  /** Focus only — never navigates or creates windows. */
  #onWmFocus = (e: Event) => {
    const { wmId } = e as WMFocusEvent;
    if (!wmId) return;
    this.#focusWindow(wmId);
  };

  /** Restore a minimized window — unminimize, raise, and focus. */
  #onWmRestore = (e: Event) => {
    const { wmId } = e as WMRestoreEvent;
    if (!wmId) return;
    this.#focusWindow(wmId);
  };

  #onWmClose = (e: Event) => {
    const { wmId } = e as WMCloseEvent;
    if (!wmId) return;

    const state = this.#windows.get(wmId);
    const el = this.#findWindowElement(wmId);

    this.#unregisterWindow(wmId);
    if (el) el.remove();

    if (state?.appId) {
      try { sessionStorage.removeItem(`app-${state.appId}`); } catch {}
    }

    if (this.#isMobile) {
      if (state?.appId) {
        // Stay on current page
      } else {
        const closeHref = state?.closeHref || '/';
        if (closeHref !== location.pathname) {
          location.href = closeHref;
        }
      }
      this.#sync();
      return;
    }

    // Desktop: focus next window after close
    if (wmId === this.#activeId) {
      const remaining = [...this.#windows.keys()];
      if (remaining.length > 0) {
        this.#focusWindow(remaining[remaining.length - 1], { animate: false });
      } else {
        this.#activeId = null;
        this.activeWindow = undefined;
      }
    }
    this.#sync();
  };

  #onWmMinimize = (e: Event) => {
    const { wmId } = e as WMMinimizeEvent;
    if (!wmId) return;
    this.#toggleMinimize(wmId);
  };

  #onWmShowDesktop = (e: Event) => {
    const { show } = e as WMShowDesktopEvent;
    if (this.#isMobile) return;
    const activeWs = this.#getActiveWorkspace();
    for (const [id, state] of this.#windows) {
      if (state.workspace === activeWs) {
        state.minimized = show;
        const el = this.#findWindowElement(id);
        if (el) el.style.display = show ? 'none' : '';
      }
    }
    this.#saveWindows();
    this.#sync();
  };

  #onWmMove = () => {
    this.#savePositions();
    this.#syncMiniatures();
  };

  #onWmWorkspaceSwitch = (e: Event) => {
    const { workspace } = e as WMWorkspaceSwitchEvent;
    if (this.#isMobile) return;
    this.#saveActiveWorkspace(workspace);
    this.#applyWorkspaceVisibility();
    this.#sync();
  };

  // ─── Pointer tracking for miniatures ──────────────────────────

  #onGotPointerCapture = () => { this.#tracking = true; };

  #onLostPointerCapture = () => {
    this.#tracking = false;
    cancelAnimationFrame(this.#rafId);
    this.#syncMiniatures();
  };

  #onPointerMove = () => {
    if (!this.#tracking) return;
    cancelAnimationFrame(this.#rafId);
    this.#rafId = requestAnimationFrame(() => this.#syncMiniatures());
  };

  #onMaximize = () => {
    this.#syncMiniatures();
  };

  // ─── Save-on-navigate handlers ────────────────────────────────

  #onPageHide = () => this.#savePositions();

  #onPageSwap = () => this.#savePositions();

  #onLinkClick = (e: MouseEvent) => {
    if (this.#isMobile) return;
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    const link = Gnome2Desktop.#fromComposed(e, 'a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    if (link.closest('#titlebar-buttons')) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.origin !== location.origin) return;
    e.preventDefault();
    this.#openWindow(link.pathname);
  };

  #onPopState = () => {
    if (this.#isMobile) return;
    const url = location.pathname;
    const existing = this.#findWindowElement(url);
    if (existing) {
      this.#focusWindow(url, { animate: false });
    } else {
      location.reload();
    }
  };

  /** Find the first element matching selector in the composed event path */
  static #fromComposed(e: Event, selector: string): HTMLElement | null {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && el.matches(selector)) return el;
    }
    return null;
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  protected override willUpdate(): void {
    // Set initial context from page attributes — runs before the first render
    // so that @provide values are available to descendants during SSR.
    // Uses the same data source (page-* attributes) for both SSR and client
    // to prevent hydration mismatches.
    if (!this.#activeId) {
      this.#activeId = isServer ? this.pageUrl : (this.pageUrl || location.pathname);
      this.activeWindow = this.#activeId;
      if (this.#activeId) {
        this.taskbarEntries = [{
          id: this.#activeId,
          url: this.#activeId,
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

    // ── Minimal initialization (safe before hydration) ──

    this.#isMobile = matchMedia('(max-width: 767px)').matches;

    // Set windowUrl on the SSR'd window (needed for wmId defaulting)
    const currentWindow = this.querySelector<Gtk2Window>('gtk2-window');
    if (currentWindow) {
      if (!currentWindow.windowUrl) {
        currentWindow.windowUrl = this.#activeId ?? location.pathname;
      }
      currentWindow.style.viewTransitionName = Gnome2Desktop.#vtName(
        this.#activeId ?? location.pathname,
      );
    }

    // Register WM event listeners (these don't cause re-renders)
    this.addEventListener('wm-close', this.#onWmClose);
    this.addEventListener('wm-minimize', this.#onWmMinimize);
    this.addEventListener('wm-restore', this.#onWmRestore);
    this.addEventListener('wm-focus', this.#onWmFocus);
    this.addEventListener('wm-move', this.#onWmMove);
    this.addEventListener('wm-show-desktop', this.#onWmShowDesktop);
    this.addEventListener('wm-workspace-switch', this.#onWmWorkspaceSwitch);

    // ── Defer full initialization until after hydration ──
    requestAnimationFrame(() => this.#boot());
  }

  /** Client-only initialization, runs after all elements have hydrated. */
  #boot() {
    this.#booted = true;
    const activeId = this.#activeId ?? location.pathname;
    this.#activeId = activeId;

    // Load persisted window state
    this.#windows = this.#loadWindows();

    // Register the current page's SSR'd window
    const currentWindow = this.querySelector<Gtk2Window>('gtk2-window');
    if (currentWindow) {
      const currentTitle = currentWindow.label || document.title;
      const currentIcon = currentWindow.icon || undefined;

      this.#registerWindow(activeId, {
        url: activeId,
        title: currentTitle,
        icon: currentIcon,
        minimized: false,
        maximized: currentWindow.maximized,
        workspace: this.#getActiveWorkspace(),
        closeHref: currentWindow.closeHref,
      });

      if (!this.#isMobile) {
        this.#placeWindow(currentWindow, activeId);
      }
    }

    // Also register any SSR'd pidgin window
    for (const win of this.querySelectorAll<Gtk2Window>('gtk2-window')) {
      if (win === currentWindow) continue;
      const id = win.wmId || win.windowUrl;
      if (!id) continue;
      this.#registerWindow(id, {
        url: win.windowUrl,
        title: win.label || '',
        icon: win.icon || undefined,
        minimized: false,
        maximized: win.maximized,
        workspace: this.#getActiveWorkspace(),
        appId: win.dataset.app,
      });
    }

    // Restore previously-open apps
    try {
      for (const id of Object.keys(APP_DEFS)) {
        if (sessionStorage.getItem(`app-${id}`)) this.launchApp(id, { focus: false });
      }
    } catch {}

    // Re-focus current page (app restoration may have stolen focus)
    this.#focusWindow(activeId, { animate: false });

    if (this.#isMobile) return;

    // ── Desktop-only initialization ──

    const activeWorkspace = this.#getActiveWorkspace();
    const currentState = this.#windows.get(activeId);
    if (currentState && currentState.workspace !== activeWorkspace) {
      this.#saveActiveWorkspace(currentState.workspace);
    }

    // Fetch and inject background windows
    (async () => {
      for (const [id, state] of [...this.#windows]) {
        if (id === activeId) continue;
        if (this.#findWindowElement(id)) continue; // already in DOM (e.g. pidgin)

        if (state.url?.startsWith('pidgin:')) {
          this.#unregisterWindow(id);
          continue;
        }

        const sourceWindow = await Gnome2Desktop.#fetchWindowContent(state.url);
        if (!sourceWindow) {
          this.#unregisterWindow(id);
          continue;
        }

        const windowEl = document.createElement('gtk2-window') as Gtk2Window;
        windowEl.label = state.title;
        windowEl.windowUrl = state.url;
        windowEl.closeHref = state.closeHref || '/';
        windowEl.style.viewTransitionName = Gnome2Desktop.#vtName(state.url);
        if (state.icon) windowEl.icon = state.icon;
        windowEl.innerHTML = sourceWindow.innerHTML;

        if (state.minimized || state.workspace !== this.#getActiveWorkspace()) {
          windowEl.style.display = 'none';
        }

        this.appendChild(windowEl);
      }

      this.#positionBackgroundWindows();
      this.#sync();
    })();

    document.getElementById('gnome2-wm-initial-pos')?.remove();

    window.addEventListener('pagehide', this.#onPageHide);
    document.addEventListener('pageswap', this.#onPageSwap);
    document.addEventListener('click', this.#onLinkClick, { capture: true });
    window.addEventListener('popstate', this.#onPopState);

    this.addEventListener('gotpointercapture', this.#onGotPointerCapture, true);
    this.addEventListener('lostpointercapture', this.#onLostPointerCapture, true);
    this.addEventListener('pointermove', this.#onPointerMove, true);
    this.addEventListener('maximize', this.#onMaximize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('wm-close', this.#onWmClose);
    this.removeEventListener('wm-minimize', this.#onWmMinimize);
    this.removeEventListener('wm-restore', this.#onWmRestore);
    this.removeEventListener('wm-focus', this.#onWmFocus);
    this.removeEventListener('wm-move', this.#onWmMove);
    this.removeEventListener('wm-show-desktop', this.#onWmShowDesktop);
    this.removeEventListener('wm-workspace-switch', this.#onWmWorkspaceSwitch);
    this.removeEventListener('gotpointercapture', this.#onGotPointerCapture, true);
    this.removeEventListener('lostpointercapture', this.#onLostPointerCapture, true);
    this.removeEventListener('pointermove', this.#onPointerMove, true);
    this.removeEventListener('maximize', this.#onMaximize);

    window.removeEventListener('pagehide', this.#onPageHide);
    document.removeEventListener('pageswap', this.#onPageSwap);
    document.removeEventListener('click', this.#onLinkClick, { capture: true });
    window.removeEventListener('popstate', this.#onPopState);
  }

  render() {
    return html`
      <!-- A gnome2-panel element for the top panel. MUST contain navigation landmarks for screen reader users. -->
      <slot name="top-panel"></slot>
      <!-- The desktop workspace area between panels. Contains icons and floating windows. -->
      <div id="workspace" part="workspace">
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
