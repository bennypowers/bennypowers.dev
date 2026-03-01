// Barrel imports — register all gnome2 custom elements
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import './gnome2-desktop.js';
import './desktop-icon.js';
import './gnome2-clock.js';
import './gnome2-panel.js';
import './gnome2-window-list.js';
import './gtk2-window.js';
import './gtk2-scrolled-window.js';
import './gtk2-button.js';
import './gtk2-menu.js';
import './gtk2-menu-item.js';
import './gtk2-menu-button.js';
import './gtk2-menu-bar.js';
import './gtk2-notebook.js';
import './gnome2-appearance-prefs.js';
import './gnome2-about.js';
import './pidgin-conversation.js';
import './pidgin-message.js';
import './gnome2-workspace-switcher.js';
import './ooo-impress.js';
import './ooo-impress-deck.js';
import './nautilus-paginated.js';

import { LitElement, html, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import styles from './gnome2-session.css';

import { activeWindowContext, type WindowEntry } from './gnome2-wm-context.js';
import type { WMFocusEvent, WMCloseEvent, WMMoveEvent } from './gtk2-window.js';
import type { WMMinimizeEvent, WMShowDesktopEvent } from './gnome2-window-list.js';
import type { WMWorkspaceSwitchEvent, MiniWindow } from './gnome2-workspace-switcher.js';
import type { Gtk2MenuButton } from './gtk2-menu-button.js';

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

const GNOME_FOOT = html`<svg slot="icon"
     class="gnome-foot"
     width="14"
     height="17"
     viewBox="0 0 256 315"
     aria-hidden="true"
     style="width:14px;height:17px;flex-shrink:0">
  <path d="M210.657507,136.722855 C221.271049,199.786823 60.255982,222.815204 120.885408,268.975729 C139.930716,283.476557 159.37779,272.368125 156.432393,249.874546 C153.973903,231.108612 222.388546,219.744752 217.02989,248.10518 C210.013619,285.296479 172.511017,314.654669 139.997234,314.654669 C73.9053856,314.654669 10.5647037,237.797619 22.9449521,182.399134 C41.2346204,100.49207 201.847922,84.3761951 210.657507,136.722855 Z M30.4587758,128.919014 C16.5140343,135.054594 -15.1589673,95.4926099 8.54256983,79.1159865 C32.2547497,62.7420237 44.4035172,122.780774 30.4587758,128.919014 Z M69.7493684,97.4934582 C53.1625494,100.883193 28.0481792,50.4495787 57.6564758,38.2316331 C87.2594509,26.0163483 86.3494907,94.1090447 69.7493684,97.4934582 Z M229.008372,0 C294.469635,0 224.913552,93.2336735 188.094751,93.2336735 C151.27063,93.2336735 163.549772,0 229.008372,0 Z M120.316018,81.6809037 C100.70132,80.4835876 87.7463596,16.4191946 124.583785,11.6379124 C161.434513,6.85663014 139.922734,82.8782197 120.316018,81.6809037 Z"
        fill="currentColor" />
</svg>`;

@customElement('gnome2-session')
export class Gnome2Session extends LitElement {
  static styles = styles;

  #desktop: HTMLElement | null = null;
  #provider: ContextProvider<typeof activeWindowContext> | null = null;
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
    const desktop = this.#desktop;
    if (!desktop) return;
    const desktopShadow = (desktop as any).shadowRoot;
    const workspace = desktopShadow?.querySelector('#windows') ?? desktop;
    const parentRect = workspace.getBoundingClientRect();
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const entry = this.#entries.find(e => e.url === url);
      if (!entry) continue;
      const rect = win.getBoundingClientRect();
      entry.x = rect.left - parentRect.left;
      entry.y = rect.top - parentRect.top;
      entry.width = rect.width;
      entry.height = rect.height;
      entry.maximized = win.hasAttribute('maximized');
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
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
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
    const windowList = document.querySelector('gnome2-window-list');
    if (!windowList) return;
    const taskbarEntries = this.#entries
      .filter(e => e.workspace === activeWorkspace)
      .map(e => ({
        url: e.url,
        title: e.title,
        icon: e.icon,
        focused: e.url === this.#currentUrl,
        minimized: e.minimized,
      }));
    // Include app windows (calculator, mines, pidgin, etc.)
    for (const win of this.#desktop?.querySelectorAll('gtk2-window[data-app]') as NodeListOf<HTMLElement> ?? []) {
      const appWs = parseInt(win.getAttribute('data-workspace') || '0', 10);
      if (appWs !== activeWorkspace) continue;
      taskbarEntries.push({
        url: win.getAttribute('window-url') ?? '',
        title: win.getAttribute('label') || '',
        icon: win.getAttribute('icon') || undefined,
        focused: win.getAttribute('window-url') === this.#currentUrl,
        minimized: win.style.display === 'none',
      });
    }
    (windowList as any).entries = taskbarEntries;
  }

  #syncMiniatures() {
    const desktop = this.#desktop;
    if (!desktop) return;
    const switcher = document.querySelector('gnome2-workspace-switcher') as any;
    if (!switcher) return;
    const activeWs = this.#getActiveWorkspace();
    switcher.active = activeWs;

    const desktopShadow = (desktop as any).shadowRoot;
    const container = desktopShadow?.querySelector('#windows') ?? desktop;
    const parentRect = container.getBoundingClientRect();
    const dw = parentRect.width || 1;
    const dh = parentRect.height || 1;

    const minis: MiniWindow[] = [];
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const appId = win.getAttribute('data-app');
      let workspace: number;
      let minimized: boolean;

      if (appId) {
        workspace = parseInt(win.getAttribute('data-workspace') || '0', 10);
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
    const desktop = this.#desktop;
    if (!desktop) return;
    const activeWorkspace = this.#getActiveWorkspace();
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const appId = win.getAttribute('data-app');
      if (appId) {
        const appWorkspace = parseInt(win.getAttribute('data-workspace') || '0', 10);
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
      Gnome2Session.#applyPosition(win, entry);
      return;
    }
    const container = (this.#desktop as any)?.shadowRoot?.querySelector('#windows');
    const workRect = container?.getBoundingClientRect() ?? { width: 840, height: 560 };
    const winW = parseFloat(win.style.width) || Math.min(workRect.width * 0.9, 840);
    const winH = parseFloat(win.style.height) || Math.min(workRect.height * 0.8, 560);
    // Try centering first (like Metacity's find_first_fit → center_tile_rect_in_area)
    const cx = Math.max(0, (workRect.width - winW) / 2);
    const cy = 16;
    if (!this.#overlapsAnyWindow(cx, cy, winW, winH)) {
      win.style.insetBlockStart = `${cy}px`;
      win.style.insetInlineStart = `${cx}px`;
      win.style.margin = '0';
      return;
    }
    // Fall back to cascade
    const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
    win.style.insetBlockStart = `${pos.y}px`;
    win.style.insetInlineStart = `${pos.x}px`;
    win.style.margin = '0';
  }

  /** Check if a proposed rectangle overlaps any visible window. */
  #overlapsAnyWindow(x: number, y: number, w: number, h: number): boolean {
    const desktop = this.#desktop;
    if (!desktop) return false;
    const container = (desktop as any).shadowRoot?.querySelector('#windows') ?? desktop;
    const parentRect = container.getBoundingClientRect();
    for (const win of desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>) {
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

  /** Metacity-style cascade: find next cascade position avoiding existing windows. */
  #findNextCascade(workW: number, workH: number, winW: number, winH: number): { x: number; y: number } {
    const desktop = this.#desktop;
    if (!desktop) return { x: 0, y: 0 };

    // Collect existing window positions, sorted by distance from origin
    const positions: { x: number; y: number }[] = [];
    const desktopShadow = (desktop as any).shadowRoot;
    const container = desktopShadow?.querySelector('#windows') ?? desktop;
    const parentRect = container.getBoundingClientRect();
    for (const win of desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>) {
      if (win.style.display === 'none') continue;
      const rect = win.getBoundingClientRect();
      positions.push({ x: rect.left - parentRect.left, y: rect.top - parentRect.top });
    }
    positions.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    let cx = 0;
    let cy = 0;
    let stage = 0;

    // Walk through positioned windows; when one is within CASCADE_FUZZ of the
    // candidate position, bump the candidate by CASCADE_INTERVAL.
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (Math.abs(p.x - cx) < CASCADE_FUZZ && Math.abs(p.y - cy) < CASCADE_FUZZ) {
        cx = p.x + CASCADE_INTERVAL;
        cy = p.y + CASCADE_INTERVAL;

        // Overflow: if the window would go off-screen, wrap
        if (cx + winW > workW || cy + winH > workH) {
          stage++;
          cx = CASCADE_INTERVAL * stage;
          cy = 0;
          i = -1; // restart scan
        }
      }
    }

    return { x: cx, y: cy };
  }

  #positionBackgroundWindows() {
    const desktop = this.#desktop;
    if (!desktop) return;
    const activeWorkspace = this.#getActiveWorkspace();
    const desktopShadow = (desktop as any).shadowRoot;
    const container = desktopShadow?.querySelector('#windows') ?? desktop;
    const workRect = container.getBoundingClientRect();
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    let bgIndex = 0;
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const entry = this.#entries.find(e => e.url === url);

      if (win.hasAttribute('data-app')) continue;

      if (entry && entry.workspace !== activeWorkspace) {
        win.style.display = 'none';
        continue;
      }

      if (url === this.#currentUrl) {
        win.style.zIndex = '100';
        if (entry?.x != null) {
          Gnome2Session.#applyPosition(win, entry);
        }
      } else {
        win.style.zIndex = String(bgIndex + 1);
        if (entry?.x != null) {
          Gnome2Session.#applyPosition(win, entry);
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

  // --- Active window context ---

  /** Pin every currently-focused window's visual position into inline styles,
   *  so that removing the [focused] attribute (and its CSS centering) doesn't
   *  cause the window to jump back. */
  #pinFocusedWindows() {
    const desktop = this.#desktop;
    if (!desktop) return;
    const desktopShadow = (desktop as any).shadowRoot;
    const container = desktopShadow?.querySelector('#windows') ?? desktop;
    const parentRect = container.getBoundingClientRect();
    for (const w of desktop.querySelectorAll('gtk2-window[focused]') as NodeListOf<HTMLElement>) {
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
    // Raise the target window above all others
    const target = this.#desktop?.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
    if (target) target.style.zIndex = String(++this.#topZ);
    const update = () => this.#provider?.setValue(url);
    if (animate && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  // --- SPA window navigation ---

  async #openWindow(url: string) {
    const desktop = this.#desktop;
    if (!desktop) return;

    // If the window already exists, just show and focus it
    const existing = desktop.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
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

    // Fetch and create a new window
    const sourceWindow = await Gnome2Session.#fetchWindowContent(url);
    if (!sourceWindow) {
      // Can't fetch — fall back to real navigation
      this.#savePositions();
      location.href = url;
      return;
    }

    const title = sourceWindow.getAttribute('label') || url;
    const icon = sourceWindow.getAttribute('icon') || undefined;
    const closeHref = sourceWindow.getAttribute('close-href') || '/';

    // Pin existing focused windows so they stay put when focus changes
    if (!this.#isMobile) {
      this.#pinFocusedWindows();
    }

    this.#addWindow(url, title, icon);

    const windowEl = document.createElement('gtk2-window');
    windowEl.setAttribute('label', title);
    windowEl.setAttribute('window-url', url);
    windowEl.setAttribute('close-href', closeHref);
    windowEl.style.viewTransitionName = Gnome2Session.#vtName(url);
    if (icon) windowEl.setAttribute('icon', icon);
    windowEl.innerHTML = sourceWindow.innerHTML;

    this.#placeWindow(windowEl, url);
    desktop.appendChild(windowEl);

    this.#setActiveWindow(url, { animate: false });
    this.#updateTaskbar();
    this.#syncMiniatures();

    history.pushState(null, '', url);
  }

  // --- App launcher ---

  async #launchApp(id: string) {
    const def = APP_DEFS[id];
    if (!def) return;
    const desktop = this.#desktop;
    if (!desktop) return;

    // Check for existing window (fully initialized or placeholder from blocking script)
    const existing = desktop.querySelector(`gtk2-window[data-app="${id}"]`) as HTMLElement | null;
    if (existing) {
      existing.style.display = '';
      // Placeholder has no children — fill it with content
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

    // Create fresh window
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
    win.style.viewTransitionName = Gnome2Session.#vtName(`app:${id}`);
    desktop.appendChild(win);
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
      // On mobile, find the close-href and navigate after cleanup
      const win = this.#desktop?.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
      const closeHref = win?.getAttribute('close-href') || '/';
      this.#removeWindow(url);
      if (win) win.remove();
      this.#updateTaskbar();
      location.href = closeHref;
      return;
    }

    this.#removeWindow(url);
    const win = this.#desktop?.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`);
    if (win) win.remove();
    this.#updateTaskbar();
    this.#syncMiniatures();
  };

  #onWmMinimize = (e: Event) => {
    if (this.#isMobile) return;
    const { url } = e as WMMinimizeEvent;
    if (!url) return;
    const win = this.#desktop?.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
    if (win?.hasAttribute('data-app')) {
      // App window — toggle display directly
      win.style.display = win.style.display === 'none' ? '' : 'none';
    } else {
      this.#toggleMinimize(url);
      if (win) {
        const entry = this.#entries.find(en => en.url === url);
        win.style.display = entry?.minimized ? 'none' : '';
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
      return;
    }

    // Pseudo-URLs (app:*) — focus in place, no pushState
    if (url.includes(':')) {
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      this.#syncMiniatures();
      return;
    }

    // Page URLs — SPA open/focus
    this.#openWindow(url);
  };

  #onWmShowDesktop = (e: Event) => {
    if (this.#isMobile) return;
    const desktop = this.#desktop;
    if (!desktop) return;
    const { show } = e as WMShowDesktopEvent;
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    const activeWs = this.#getActiveWorkspace();
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const appId = win.getAttribute('data-app');
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
    const link = Gnome2Session.#fromComposed(e, 'a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    if (link.matches('#btn-close')) return;
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
    const existing = this.#desktop?.querySelector(`gtk2-window[window-url="${CSS.escape(url)}"]`) as HTMLElement | null;
    if (existing) {
      existing.style.display = '';
      this.#setActiveWindow(url);
      this.#updateTaskbar();
      this.#syncMiniatures();
    } else {
      location.reload();
    }
  };

  // --- Lifecycle ---

  override async connectedCallback() {
    super.connectedCallback();
    if (isServer) return;

    this.#isMobile = matchMedia('(max-width: 767px)').matches;
    this.#desktop = document.querySelector('gnome2-desktop');
    const desktop = this.#desktop;
    if (!desktop) return;

    // Create ContextProvider on gnome2-desktop
    this.#currentUrl = location.pathname;
    this.#provider = new ContextProvider(desktop, {
      context: activeWindowContext,
      initialValue: this.#currentUrl,
    });

    // Register current page window
    const currentWindow = desktop.querySelector('gtk2-window') as HTMLElement | null;
    const currentTitle = currentWindow?.getAttribute('label') || document.title;
    const currentIcon = currentWindow?.getAttribute('icon') || undefined;

    if (currentWindow) {
      currentWindow.setAttribute('window-url', this.#currentUrl);
      currentWindow.style.viewTransitionName = Gnome2Session.#vtName(this.#currentUrl);
    }

    this.#entries = this.#getWindows();

    if (currentWindow) {
      this.#addWindow(this.#currentUrl, currentTitle, currentIcon);
      // Apply saved position or center as default (replaces CSS auto-centering)
      this.#placeWindow(currentWindow, this.#currentUrl);
    }

    // Always register WM event listeners (fixes mobile close/minimize)
    desktop.addEventListener('wm-close', this.#onWmClose);
    desktop.addEventListener('wm-minimize', this.#onWmMinimize);
    desktop.addEventListener('wm-focus', this.#onWmFocus);
    desktop.addEventListener('wm-move', this.#onWmMove);
    desktop.addEventListener('wm-show-desktop', this.#onWmShowDesktop);
    desktop.addEventListener('wm-workspace-switch', this.#onWmWorkspaceSwitch);

    // Listen for click events
    document.addEventListener('click', this.#onSchemeClick);
    document.addEventListener('click', this.#onLaunchClick);

    // Restore previously-open apps
    try {
      for (const id of Object.keys(APP_DEFS)) {
        if (sessionStorage.getItem('app-' + id)) this.#launchApp(id);
      }
    } catch {}

    if (this.#isMobile) return;

    // --- Desktop-only initialization ---

    // Ensure current window is on the active workspace
    const activeWorkspace = this.#getActiveWorkspace();
    const currentEntry = this.#entries.find(e => e.url === this.#currentUrl);
    if (currentEntry && currentEntry.workspace !== activeWorkspace) {
      this.#saveActiveWorkspace(currentEntry.workspace);
    }

    // Fetch and inject background windows
    for (const entry of [...this.#entries]) {
      if (entry.url === this.#currentUrl) continue;

      // Pidgin windows are page-specific SSR content, not fetchable
      if (entry.url?.startsWith('pidgin:')) {
        this.#removeWindow(entry.url);
        continue;
      }

      const sourceWindow = await Gnome2Session.#fetchWindowContent(entry.url!);
      if (!sourceWindow) {
        this.#removeWindow(entry.url!);
        continue;
      }

      const windowEl = document.createElement('gtk2-window');
      windowEl.setAttribute('label', entry.title);
      windowEl.setAttribute('window-url', entry.url!);
      windowEl.setAttribute('close-href', '/');
      windowEl.style.viewTransitionName = Gnome2Session.#vtName(entry.url!);
      if (entry.icon) windowEl.setAttribute('icon', entry.icon);
      windowEl.innerHTML = sourceWindow.innerHTML;

      if (entry.minimized || entry.workspace !== this.#getActiveWorkspace()) {
        windowEl.style.display = 'none';
      }

      desktop.appendChild(windowEl);
    }

    this.#positionBackgroundWindows();
    this.#updateTaskbar();
    this.#syncMiniatures();

    // Remove the blocking script's initial position style
    document.getElementById('gnome2-wm-initial-pos')?.remove();

    // Save positions before any navigation
    window.addEventListener('pagehide', this.#onPageHide);
    document.addEventListener('pageswap', this.#onPageSwap);
    document.addEventListener('click', this.#onLinkClick, { capture: true });
    window.addEventListener('popstate', this.#onPopState);

    // Real-time miniature updates during drag/resize
    desktop.addEventListener('gotpointercapture', this.#onGotPointerCapture, true);
    desktop.addEventListener('lostpointercapture', this.#onLostPointerCapture, true);
    desktop.addEventListener('pointermove', this.#onPointerMove, true);
    desktop.addEventListener('maximize', this.#onMaximize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    const desktop = this.#desktop;

    document.removeEventListener('click', this.#onSchemeClick);
    document.removeEventListener('click', this.#onLaunchClick);

    if (desktop) {
      desktop.removeEventListener('wm-close', this.#onWmClose);
      desktop.removeEventListener('wm-minimize', this.#onWmMinimize);
      desktop.removeEventListener('wm-focus', this.#onWmFocus);
      desktop.removeEventListener('wm-move', this.#onWmMove);
      desktop.removeEventListener('wm-show-desktop', this.#onWmShowDesktop);
      desktop.removeEventListener('wm-workspace-switch', this.#onWmWorkspaceSwitch);
      desktop.removeEventListener('gotpointercapture', this.#onGotPointerCapture, true);
      desktop.removeEventListener('lostpointercapture', this.#onLostPointerCapture, true);
      desktop.removeEventListener('pointermove', this.#onPointerMove, true);
      desktop.removeEventListener('maximize', this.#onMaximize);
    }

    window.removeEventListener('pagehide', this.#onPageHide);
    document.removeEventListener('pageswap', this.#onPageSwap);
    document.removeEventListener('click', this.#onLinkClick, { capture: true });
    window.removeEventListener('popstate', this.#onPopState);
  }

  /** Find the first element matching selector in the composed event path */
  static #fromComposed(e: Event, selector: string): HTMLElement | null {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && el.matches(selector)) return el;
    }
    return null;
  }

  #onSchemeClick = (e: MouseEvent) => {
    const item = Gnome2Session.#fromComposed(e, '[data-scheme]');
    if (!item) return;
    const scheme = item.dataset.scheme!;
    const root = document.documentElement;
    root.style.colorScheme =
      scheme === 'light' ? 'light only' :
      scheme === 'dark' ? 'dark only' : 'light dark';
    root.dataset.scheme = scheme === 'light' || scheme === 'dark' ? scheme : 'system';
    try { localStorage.setItem('cl-color-scheme', scheme); } catch {};
  };

  #onLaunchClick = (e: MouseEvent) => {
    const item = Gnome2Session.#fromComposed(e, '[data-launch]');
    if (!item) return;
    e.preventDefault();
    for (const mb of document.querySelectorAll('gtk2-menu-button[open]')) {
      (mb as Gtk2MenuButton).hide();
    }
    for (const mb of this.shadowRoot?.querySelectorAll('gtk2-menu-button[open]') ?? []) {
      (mb as Gtk2MenuButton).hide();
    }
    this.#launchApp(item.dataset.launch!);
  };

  render() {
    return html`
      <gtk2-menu-bar>
        <gtk2-menu-button label="Applications">
          ${GNOME_FOOT}
          <gtk2-menu-item label="Accessories"
                          icon="categories/applications-accessories">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Calculator"
                              data-launch="calculator"
                              icon="apps/accessories-calculator"></gtk2-menu-item>
              <gtk2-menu-item label="Text Editor"
                              href="/posts/"
                              icon="apps/accessories-text-editor"></gtk2-menu-item>
              <gtk2-menu-item label="Terminal"
                              href="https://github.com/bennypowers"
                              icon="apps/utilities-terminal"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Games"
                          icon="categories/applications-games">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Mines"
                              data-launch="mines"
                              icon="categories/applications-games"></gtk2-menu-item>
              <gtk2-menu-item label="SuperTux"
                              data-launch="supertux"
                              icon="apps/supertux"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Internet"
                          icon="categories/applications-internet">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Pidgin Internet Messenger"
                              data-launch="pidgin"
                              icon="apps/internet-group-chat"></gtk2-menu-item>
              <gtk2-menu-item label="Web Browser"
                              href="/decks/"
                              icon="apps/internet-web-browser"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
        </gtk2-menu-button>

        <gtk2-menu-button label="Places">
          <gtk2-menu-item label="Home"
                          href="/"
                          icon="places/user-home"></gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="Posts"
                          href="/posts/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-posts"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Tags"
                          href="/tags/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-tags"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Decks"
                          href="/decks/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-decks"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="GitHub"
                          href="https://github.com/bennypowers"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="GitLab"
                          href="https://gitlab.com/bennyp"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="Mastodon"
                          href="https://social.bennypowers.com/@bp"
                          icon="apps/internet-group-chat"></gtk2-menu-item>
          <gtk2-menu-item label="LinkedIn"
                          href="https://il.linkedin.com/in/bennypowers"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="StackOverflow"
                          href="https://stackexchange.com/users/2936504/benny-powers"
                          icon="apps/internet-web-browser"></gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="RSS Feed"
                          href="/feed.xml"
                          icon="mimetypes/application-rss+xml"></gtk2-menu-item>
        </gtk2-menu-button>

        <gtk2-menu-button label="System">
          <gtk2-menu-item label="Preferences"
                          icon="categories/preferences-desktop">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Appearance"
                              href="/appearance/"
                              icon="apps/preferences-desktop-theme"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="Help"
                          href="/help/"
                          icon="apps/help-browser"></gtk2-menu-item>
          <gtk2-menu-item label="About"
                          data-launch="about"
                          icon="status/dialog-information"></gtk2-menu-item>
        </gtk2-menu-button>
      </gtk2-menu-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-session': Gnome2Session;
  }
}
