import type { WMFocusEvent, WMCloseEvent, Gtk2Window } from './gtk2-window.js';
import type { WMMinimizeEvent, WMShowDesktopEvent } from './gnome2-window-list.js';
import type { WMWorkspaceSwitchEvent, MiniWindow } from './gnome2-workspace-switcher.js';

import { LitElement, html, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import styles from './gnome2-desktop.css';

import { activeWindowContext, taskbarContext, type WindowEntry, type TaskbarEntry } from './gnome2-wm-context.js';

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
    module: 'gnome2/gnome2-calculator.js',
    tag: 'gnome2-calculator',
    label: 'Calculator',
    icon: 'apps/accessories-calculator',
    width: '260px',
    height: '320px',
  },
  mines: {
    module: 'gnome2/gnome2-mines.js',
    tag: 'gnome2-mines',
    label: 'Mines',
    icon: 'categories/applications-games',
    width: '280px',
    height: '360px',
  },
  supertux: {
    module: 'gnome2/gnome2-supertux.js',
    tag: 'gnome2-supertux',
    label: 'SuperTux',
    icon: 'apps/supertux',
    width: '800px',
    height: '600px',
  },
  about: {
    module: 'gnome2/gnome2-about.js',
    tag: 'gnome2-about',
    label: 'About bennypowers.dev',
    icon: 'status/dialog-information',
    width: '550px',
    height: '500px',
  },
  pidgin: {
    module: 'gnome2/pidgin-conversation.js',
    tag: 'pidgin-conversation',
    label: 'Conversation',
    icon: 'apps/internet-group-chat',
    width: '450px',
    height: '400px',
    attrs: () => ({ 'post-url': `https://bennypowers.dev${location.pathname}` }),
  },
};

@customElement('gnome2-desktop')
export class Gnome2Desktop extends LitElement {
  static styles = styles;

  @provide({ context: activeWindowContext })
  @property({ attribute: false })
  accessor activeWindow: string | undefined = undefined;

  @provide({ context: taskbarContext })
  @property({ attribute: false })
  accessor taskbarEntries: TaskbarEntry[] = [];

  @property({ attribute: 'page-url' }) accessor pageUrl = '';
  @property({ attribute: 'page-title' }) accessor pageTitle = '';
  @property({ attribute: 'page-icon' }) accessor pageIcon = '';

  #entries: WindowEntry[] = [];
  #currentUrl = '';
  #isMobile = false;
  #tracking = false;
  #topZ = 100;
  #rafId = 0;

  // --- Storage helpers ---

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

  #getWindows(): WindowEntry[] {
    try {
      const entries: WindowEntry[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      for (const entry of entries) {
        if (entry.workspace == null) entry.workspace = 0;
      }
      return entries;
    } catch {
      return [];
    }
  }

  #saveWindows() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.#entries));
    } catch {}
  }

  #addWindow(url: string, title: string, icon?: string) {
    const existing = this.#entries.find(e => e.url === url);
    if (existing) {
      existing.title = title;
      existing.minimized = false;
      if (icon) existing.icon = icon;
    } else {
      this.#entries.push({ url, title, icon, minimized: false, workspace: this.#getActiveWorkspace() });
    }
    this.#saveWindows();
  }

  #removeWindow(url: string) {
    this.#entries = this.#entries.filter(e => e.url !== url);
    this.#saveWindows();
  }

  #toggleMinimize(url: string) {
    const entry = this.#entries.find(e => e.url === url);
    if (entry) entry.minimized = !entry.minimized;
    this.#saveWindows();
  }

  // --- Position helpers ---

  #savePositions() {
    const workspace = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = workspace.getBoundingClientRect();
    const windows = this.querySelectorAll('gtk2-window');
    for (const win of windows) {
      const url = win.windowUrl
      const entry = this.#entries.find(e => e.url === url);
      if (!entry) continue;
      const rect = win.getBoundingClientRect();
      entry.x = rect.left - parentRect.left;
      entry.y = rect.top - parentRect.top;
      entry.width = rect.width;
      entry.height = rect.height;
      entry.maximized = win.maximized;
    }
    this.#saveWindows();
  }

  static #applyPosition(win: HTMLElement, entry: WindowEntry) {
    if (entry.maximized) {
      win.setAttribute('maximized', '');
      return;
    }
    if (entry.x != null && entry.y != null) {
      win.style.insetBlockStart = `${entry.y}px`;
      win.style.insetInlineStart = `${entry.x}px`;
      win.style.margin = '0';
    }
    if (entry.width != null) {
      win.style.width = `${entry.width}px`;
    }
    if (entry.height != null) {
      win.style.height = `${entry.height}px`;
    }
  }

  // --- Fetch + inject ---

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

  // --- Taskbar + miniatures ---

  #updateTaskbar() {
    const activeWorkspace = this.#getActiveWorkspace();
    const taskbarEntries: TaskbarEntry[] = this.#entries
      .filter(e => e.workspace === activeWorkspace)
      .map(e => ({
        url: e.url!,
        title: e.title,
        icon: e.icon,
        focused: e.url === this.#currentUrl,
        minimized: e.minimized,
      }));
    // Include app windows (calculator, mines, pidgin, etc.)
    for (const win of this.querySelectorAll('gtk2-window[data-app]') as NodeListOf<Gtk2Window>) {
      const appWs = parseInt(win.getAttribute('data-workspace') || '0', 10);
      if (appWs !== activeWorkspace) continue;
      taskbarEntries.push({
        url: win.windowUrl ?? '',
        title: win.label || '',
        icon: win.icon || undefined,
        focused: win.windowUrl === this.#currentUrl,
        minimized: win.style.display === 'none',
      });
    }
    this.taskbarEntries = taskbarEntries;
  }

  #syncMiniatures() {
    const switcher = document.querySelector('gnome2-workspace-switcher') as any;
    if (!switcher) return;
    const activeWs = this.#getActiveWorkspace();
    switcher.active = activeWs;

    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    const dw = parentRect.width || 1;
    const dh = parentRect.height || 1;

    const minis: MiniWindow[] = [];
    const windows = this.querySelectorAll('gtk2-window');
    for (const win of windows) {
      const url = win.windowUrl
      const appId = win.dataset.app
      let workspace: number;
      let minimized: boolean;

      if (appId) {
        workspace = parseInt(win.dataset.workspace || '0', 10);
        minimized = win.style.display === 'none' && workspace === activeWs;
      } else {
        const entry = this.#entries.find(e => e.url === url);
        if (!entry) continue;
        workspace = entry.workspace;
        minimized = entry.minimized;
      }

      if (win.style.display === 'none') {
        const entry = !appId ? this.#entries.find(e => e.url === url) : undefined;
        if (entry && entry.width != null && entry.height != null) {
          minis.push({
            workspace,
            x: Math.max(0, (entry.x ?? 0) / dw),
            y: Math.max(0, (entry.y ?? 0) / dh),
            w: entry.width / dw,
            h: entry.height / dh,
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

  // --- Workspace visibility ---

  #applyWorkspaceVisibility() {
    const activeWorkspace = this.#getActiveWorkspace();
    const windows = this.querySelectorAll('gtk2-window');
    for (const win of windows) {
      const url = win.windowUrl
      const appId = win.dataset.app;
      if (appId) {
        const appWorkspace = parseInt(win.dataset.workspace || '0', 10);
        win.style.display = appWorkspace === activeWorkspace ? '' : 'none';
        continue;
      }
      const entry = this.#entries.find(e => e.url === url);
      if (!entry) continue;
      if (entry.workspace !== activeWorkspace) {
        win.style.display = 'none';
      } else if (entry.minimized) {
        win.style.display = 'none';
      } else {
        win.style.display = '';
      }
    }
  }

  /** Metacity-style placement: saved position → center if no overlap → cascade. */
  #placeWindow(win: HTMLElement, url: string) {
    const entry = this.#entries.find(e => e.url === url);
    if (entry?.x != null) {
      Gnome2Desktop.#applyPosition(win, entry);
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
    win.style.insetBlockStart = `${pos.y}px`;
    win.style.insetInlineStart = `${pos.x}px`;
    win.style.margin = '0';
  }

  #overlapsAnyWindow(x: number, y: number, w: number, h: number): boolean {
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    for (const win of this.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>) {
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
    for (const win of this.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>) {
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
    const windows = this.querySelectorAll('gtk2-window');
    let bgIndex = 0;
    for (const win of windows) {
      const url = win.windowUrl
      const entry = this.#entries.find(e => e.url === url);

      if (win.hasAttribute('data-app')) continue;

      if (entry && entry.workspace !== activeWorkspace) {
        win.style.display = 'none';
        continue;
      }

      if (url === this.#currentUrl) {
        win.style.zIndex = '100';
        if (entry?.x != null) {
          Gnome2Desktop.#applyPosition(win, entry);
        }
      } else {
        win.style.zIndex = String(bgIndex + 1);
        if (entry?.x != null) {
          Gnome2Desktop.#applyPosition(win, entry);
        } else {
          const winW = parseFloat(win.style.width) || 840;
          const winH = parseFloat(win.style.height) || 560;
          const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
          win.style.insetBlockStart = `${pos.y}px`;
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

  // --- Active window management ---

  #pinFocusedWindows() {
    const container = this.shadowRoot?.querySelector('#windows') ?? this;
    const parentRect = container.getBoundingClientRect();
    for (const w of this.querySelectorAll('gtk2-window[focused]') as NodeListOf<HTMLElement>) {
      const rect = w.getBoundingClientRect();
      const tx = new DOMMatrix(getComputedStyle(w).transform);
      w.style.insetBlockStart = `${rect.top - parentRect.top - tx.m42}px`;
      w.style.insetInlineStart = `${rect.left - parentRect.left - tx.m41}px`;
      w.style.margin = '0';
    }
  }

  #setActiveWindow(url: string, { animate = true } = {}) {
    if (!this.#isMobile) {
      this.#pinFocusedWindows();
    }
    this.#currentUrl = url;
    const target = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as Gtk2Window | null;
    if (target) target.style.zIndex = String(++this.#topZ);
    const update = () => { this.activeWindow = url; };
    if (animate && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  // --- SPA window navigation ---

  async #openWindow(url: string) {
    const existing = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as Gtk2Window | null;
    if (existing) {
      existing.style.display = '';
      const entry = this.#entries.find(e => e.url === url);
      if (entry) {
        entry.minimized = false;
        this.#saveWindows();
      }
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      this.#syncMiniatures();
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

    this.#addWindow(url, title, icon);

    const windowEl = document.createElement('gtk2-window');
    windowEl.label = title;
    console.log('set windowEl.windowUrl = url', url)
    windowEl.windowUrl = url;
    windowEl.closeHref = closeHref;
    windowEl.style.viewTransitionName = Gnome2Desktop.#vtName(url);
    if (icon) windowEl.icon = icon;
    windowEl.innerHTML = sourceWindow.innerHTML;

    this.#placeWindow(windowEl, url);
    this.appendChild(windowEl);

    this.#setActiveWindow(url, { animate: false });
    this.#updateTaskbar();
    this.#syncMiniatures();

    history.pushState(null, '', url);
  }

  // --- App launcher ---

  async launchApp(id: string) {
    const def = APP_DEFS[id];
    if (!def) return;

    const existing = this.querySelector(`gtk2-window[data-app="${id}"]`) as HTMLElement | null;
    if (existing) {
      existing.style.display = '';
      if (!existing.querySelector(def.tag)) {
        await import(def.module);
        const child = document.createElement(def.tag);
        if (def.attrs) {
          for (const [k, v] of Object.entries(def.attrs())) child.setAttribute(k, v);
        }
        existing.appendChild(child);
        existing.addEventListener('close', () => {
          existing.remove();
          try { sessionStorage.removeItem('app-' + id); } catch {}
        });
      }
      this.#setActiveWindow('app:' + id);
      this.#updateTaskbar();
      return;
    }

    await import(def.module);
    const win = document.createElement('gtk2-window');
    win.setAttribute('label', def.label);
    win.setAttribute('icon', def.icon);
    win.setAttribute('dialog', '');
    win.setAttribute('data-app', id);
    win.setAttribute('window-url', `app:${id}`);
    try {
      win.setAttribute('data-workspace', sessionStorage.getItem(WORKSPACE_KEY) || '0');
    } catch { win.setAttribute('data-workspace', '0'); }
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
    win.style.viewTransitionName = Gnome2Desktop.#vtName(`app:${id}`);
    this.appendChild(win);
    this.#setActiveWindow('app:' + id);
    win.addEventListener('close', () => {
      win.remove();
      try { sessionStorage.removeItem('app-' + id); } catch {}
    });
    try { sessionStorage.setItem('app-' + id, '1'); } catch {}
    this.#updateTaskbar();
  }

  // --- WM Event Handlers ---

  #onWmClose = (e: Event) => {
    const { url } = e as WMCloseEvent;
    if (!url) return;

    if (this.#isMobile) {
      const win = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
      this.#removeWindow(url);
      if (win) win.remove();
      this.#updateTaskbar();
      if (url.startsWith('app:')) {
        const appId = url.slice(4);
        try { sessionStorage.removeItem('app-' + appId); } catch {}
        this.#setActiveWindow(this.#currentUrl, { animate: false });
      } else {
        const closeHref = win?.getAttribute('close-href') || '/';
        if (closeHref !== location.pathname) {
          location.href = closeHref;
        }
      }
      return;
    }

    this.#removeWindow(url);
    const win = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`);
    if (win) win.remove();
    this.#updateTaskbar();
    this.#syncMiniatures();
  };

  #onWmMinimize = (e: Event) => {
    const { url } = e as WMMinimizeEvent;
    if (!url) return;
    const win = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
    if (win?.hasAttribute('data-app')) {
      const showing = win.style.display === 'none';
      win.style.display = showing ? '' : 'none';
      if (this.#isMobile && showing) {
        this.#setActiveWindow(url, { animate: false });
      }
    } else {
      this.#toggleMinimize(url);
      if (win) {
        const entry = this.#entries.find(en => en.url === url);
        win.style.display = entry?.minimized ? 'none' : '';
        if (this.#isMobile && !entry?.minimized) {
          this.#setActiveWindow(url, { animate: false });
        }
      }
    }
    this.#updateTaskbar();
    this.#syncMiniatures();
  };

  #onWmFocus = (e: Event) => {
    const { url } = e as WMFocusEvent;
    if (!url) return;

    if (this.#isMobile) {
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      return;
    }

    if (url.includes(':')) {
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      this.#syncMiniatures();
      return;
    }

    this.#openWindow(url);
  };

  #onWmShowDesktop = (e: Event) => {
    if (this.#isMobile) return;
    const { show } = e as WMShowDesktopEvent;
    const windows = this.querySelectorAll('gtk2-window');
    const activeWs = this.#getActiveWorkspace();
    for (const win of windows) {
      const url = win.windowUrl;
      const appId = win.dataset.app;
      if (appId) {
        const appWs = parseInt(win.getAttribute('data-workspace') || '0', 10);
        if (appWs === activeWs) win.style.display = show ? 'none' : '';
      } else {
        const entry = this.#entries.find(en => en.url === url);
        if (entry && entry.workspace === activeWs) {
          win.style.display = show ? 'none' : '';
        }
      }
    }
    for (const entry of this.#entries) {
      if (entry.workspace === activeWs) {
        entry.minimized = show;
      }
    }
    this.#saveWindows();
    this.#updateTaskbar();
    this.#syncMiniatures();
  };

  #onWmMove = () => {
    this.#savePositions();
    this.#syncMiniatures();
  };

  #onWmWorkspaceSwitch = (e: Event) => {
    if (this.#isMobile) return;
    const { workspace } = e as WMWorkspaceSwitchEvent;
    this.#saveActiveWorkspace(workspace);
    this.#applyWorkspaceVisibility();
    this.#updateTaskbar();
    this.#syncMiniatures();
  };

  // --- Pointer tracking for miniatures ---

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

  // --- Save-on-navigate handlers ---

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
    const existing = this.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
    if (existing) {
      existing.style.display = '';
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      this.#syncMiniatures();
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

  // --- Lifecycle ---

  protected override willUpdate(): void {
    // Set initial context from page attributes — runs before the first render
    // so that @provide values are available to descendants during SSR.
    if (!this.#currentUrl) {
      this.#currentUrl = isServer ? this.pageUrl : location.pathname;
      this.activeWindow = this.#currentUrl;
      if (this.#currentUrl) {
        const title = isServer
          ? this.pageTitle
          : (this.querySelector('gtk2-window') as HTMLElement)?.getAttribute('label') || document.title;
        const icon = isServer
          ? this.pageIcon || undefined
          : (this.querySelector('gtk2-window') as HTMLElement)?.getAttribute('icon') || undefined;
        this.taskbarEntries = [{
          url: this.#currentUrl,
          title,
          icon,
          focused: true,
          minimized: false,
        }];
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    if (isServer) return;

    // --- Client-only initialization ---

    // willUpdate may not have run yet (hydration defers the first update)
    if (!this.#currentUrl) {
      this.#currentUrl = location.pathname;
      this.activeWindow = this.#currentUrl;
    }

    this.#isMobile = matchMedia('(max-width: 767px)').matches;

    // Register current page window
    const currentWindow = this.querySelector('gtk2-window');
    const currentTitle = currentWindow?.getAttribute('label') || document.title;
    const currentIcon = currentWindow?.getAttribute('icon') || undefined;

    if (currentWindow) {
      currentWindow.windowUrl = this.#currentUrl;
      currentWindow.style.viewTransitionName = Gnome2Desktop.#vtName(this.#currentUrl);
    }

    this.#entries = this.#getWindows();

    if (currentWindow) {
      this.#addWindow(this.#currentUrl, currentTitle, currentIcon);
      if (!this.#isMobile) {
        this.#placeWindow(currentWindow, this.#currentUrl);
      }
    }

    // WM event listeners
    this.addEventListener('wm-close', this.#onWmClose);
    this.addEventListener('wm-minimize', this.#onWmMinimize);
    this.addEventListener('wm-focus', this.#onWmFocus);
    this.addEventListener('wm-move', this.#onWmMove);
    this.addEventListener('wm-show-desktop', this.#onWmShowDesktop);
    this.addEventListener('wm-workspace-switch', this.#onWmWorkspaceSwitch);

    // Restore previously-open apps
    try {
      for (const id of Object.keys(APP_DEFS)) {
        if (sessionStorage.getItem('app-' + id)) this.launchApp(id);
      }
    } catch {}

    // Re-focus current page (app restoration may have stolen focus)
    this.#setActiveWindow(this.#currentUrl, { animate: false });
    this.#updateTaskbar();

    if (this.#isMobile) return;

    // --- Desktop-only initialization ---

    const activeWorkspace = this.#getActiveWorkspace();
    const currentEntry = this.#entries.find(e => e.url === this.#currentUrl);
    if (currentEntry && currentEntry.workspace !== activeWorkspace) {
      this.#saveActiveWorkspace(currentEntry.workspace);
    }

    // Fetch and inject background windows
    (async () => {
      for (const entry of [...this.#entries]) {
        if (entry.url === this.#currentUrl) continue;

        if (entry.url?.startsWith('pidgin:')) {
          this.#removeWindow(entry.url);
          continue;
        }

        const sourceWindow = await Gnome2Desktop.#fetchWindowContent(entry.url!);
        if (!sourceWindow) {
          this.#removeWindow(entry.url!);
          continue;
        }

        const windowEl = document.createElement('gtk2-window');
        windowEl.label= entry.title;
        windowEl.windowUrl= entry.url!;
        windowEl.closeHref = '/';
        windowEl.style.viewTransitionName = Gnome2Desktop.#vtName(entry.url!);
        if (entry.icon) windowEl.setAttribute('icon', entry.icon);
        windowEl.innerHTML = sourceWindow.innerHTML;

        if (entry.minimized || entry.workspace !== this.#getActiveWorkspace()) {
          windowEl.style.display = 'none';
        }

        this.appendChild(windowEl);
      }

      this.#positionBackgroundWindows();
      this.#updateTaskbar();
      this.#syncMiniatures();
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
      <slot name="top-panel"></slot>
      <div id="workspace" part="workspace">
        <div id="icons">
          <slot name="icons"></slot>
        </div>
        <div id="windows">
          <slot></slot>
        </div>
      </div>
      <slot name="bottom-panel"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-desktop': Gnome2Desktop;
  }
}
