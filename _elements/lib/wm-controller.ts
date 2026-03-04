import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Gtk2Window } from '../gtk2-window/gtk2-window.js';
import type { MiniWindow } from '../gnome2-workspace-switcher/gnome2-workspace-switcher.js';
import type { WindowEntry, TaskbarEntry } from '../gnome2-wm-context/gnome2-wm-context.js';
import { WMEvent } from './wm-event.js';

const STORAGE_KEY = 'gnome2-wm-windows';
const WORKSPACE_KEY = 'gnome2-wm-workspace';
const CASCADE_INTERVAL = 50;
const CASCADE_FUZZ = 15;

export interface WMWindowState {
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

export interface WMControllerOptions {
  onActiveWindowChange: (id: string | undefined) => void;
  onTaskbarChange: (entries: TaskbarEntry[]) => void;
}

type WMHost = ReactiveControllerHost & HTMLElement & { shadowRoot: ShadowRoot | null };

export class WMController implements ReactiveController {
  windows = new Map<string, WMWindowState>();
  activeId: string | null = null;
  isMobile = false;
  booted = false;

  #topZ = 100;
  #tracking = false;
  #rafId = 0;
  #options: WMControllerOptions;

  constructor(private host: WMHost, options: WMControllerOptions) {
    this.#options = options;
    host.addController(this);
  }

  hostConnected() {
    this.host.addEventListener('wm-event', this.#onWmEvent);
  }

  hostDisconnected() {
    this.host.removeEventListener('wm-event', this.#onWmEvent);
  }

  // ─── DOM helpers ──────────────────────────────────────────────

  get #windowsContainer() {
    return this.host.shadowRoot?.querySelector('#windows') ?? this.host;
  }

  findWindowElement(id: string): Gtk2Window | null {
    for (const win of this.host.querySelectorAll<Gtk2Window>('gtk2-window')) {
      if (win.wmId === id || win.windowUrl === id) return win;
    }
    return null;
  }

  // ─── Storage ──────────────────────────────────────────────────

  getActiveWorkspace(): number {
    try { return parseInt(sessionStorage.getItem(WORKSPACE_KEY) || '0', 10) || 0; }
    catch { return 0; }
  }

  saveActiveWorkspace(index: number) {
    try { sessionStorage.setItem(WORKSPACE_KEY, String(index)); } catch {}
  }

  loadWindows(): Map<string, WMWindowState> {
    try {
      const raw: WindowEntry[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      const map = new Map<string, WMWindowState>();
      for (const e of raw) {
        const id = e.id ?? e.url ?? '';
        map.set(id, {
          id, url: e.url ?? '', title: e.title, icon: e.icon,
          minimized: e.minimized, maximized: e.maximized ?? false,
          workspace: e.workspace ?? 0,
          position: (e.x != null && e.y != null)
            ? { x: e.x, y: Math.max(0, e.y), width: e.width ?? 0, height: e.height ?? 0 }
            : undefined,
          closeHref: e.closeHref, appId: e.appId,
        });
      }
      return map;
    } catch { return new Map(); }
  }

  saveWindows() {
    try {
      const arr = [...this.windows.values()].map(w => ({
        id: w.id, url: w.url, title: w.title, icon: w.icon,
        minimized: w.minimized, maximized: w.maximized, workspace: w.workspace,
        x: w.position?.x, y: w.position?.y,
        width: w.position?.width, height: w.position?.height,
        closeHref: w.closeHref, appId: w.appId,
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {}
  }

  // ─── State machine ────────────────────────────────────────────

  registerWindow(id: string, state: Omit<WMWindowState, 'id'>): WMWindowState {
    const existing = this.windows.get(id);
    if (existing) {
      existing.title = state.title;
      existing.minimized = false;
      if (state.icon) existing.icon = state.icon;
      if (state.closeHref) existing.closeHref = state.closeHref;
    } else {
      this.windows.set(id, { ...state, id });
    }
    this.saveWindows();
    return this.windows.get(id)!;
  }

  unregisterWindow(id: string) {
    this.windows.delete(id);
    this.saveWindows();
  }

  focusWindow(id: string, { animate = true } = {}) {
    const state = this.windows.get(id);
    if (state?.minimized) { state.minimized = false; this.saveWindows(); }
    if (!this.isMobile) this.pinFocusedWindows(id);
    this.activeId = id;

    const el = this.findWindowElement(id);
    if (el) { el.style.display = ''; el.style.zIndex = String(++this.#topZ); }

    const update = () => { this.#options.onActiveWindowChange(id); };
    if (animate && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      update();
    }
    this.sync();
  }

  toggleMinimize(id: string) {
    const state = this.windows.get(id);
    const el = this.findWindowElement(id);
    if (state) {
      state.minimized = !state.minimized;
      this.saveWindows();
      if (el) el.style.display = state.minimized ? 'none' : '';
      if (this.isMobile && !state.minimized) {
        this.activeId = id;
        this.#options.onActiveWindowChange(id);
      }
    }
    this.sync();
  }

  sync() {
    if (!this.booted) return;
    this.updateTaskbar();
    if (!this.isMobile) this.syncMiniatures();
  }

  // ─── Position helpers ─────────────────────────────────────────

  savePositions() {
    const parentRect = this.#windowsContainer.getBoundingClientRect();
    const windowEls = this.host.querySelectorAll<Gtk2Window>('gtk2-window');
    const rects = new Map<Gtk2Window, DOMRect>();
    for (const win of windowEls) rects.set(win, win.getBoundingClientRect());
    for (const win of windowEls) {
      const id = win.wmId || win.windowUrl;
      const state = this.windows.get(id);
      if (!state) continue;
      const rect = rects.get(win)!;
      state.position = {
        x: rect.left - parentRect.left, y: Math.max(0, rect.top - parentRect.top),
        width: rect.width, height: rect.height,
      };
      state.maximized = win.maximized;
    }
    this.saveWindows();
  }

  static applyPosition(win: HTMLElement, state: WMWindowState) {
    if (state.maximized) { win.setAttribute('maximized', ''); return; }
    if (state.position) {
      win.style.insetBlockStart = `${Math.max(0, state.position.y)}px`;
      win.style.insetInlineStart = `${state.position.x}px`;
      win.style.margin = '0';
      if (state.position.width) win.style.width = `${state.position.width}px`;
      if (state.position.height) win.style.height = `${state.position.height}px`;
    }
  }

  placeWindow(win: HTMLElement, id: string) {
    const state = this.windows.get(id);
    if (state?.position) { WMController.applyPosition(win, state); return; }
    const workRect = this.#windowsContainer.getBoundingClientRect();
    const winW = parseFloat(win.style.width) || Math.min(workRect.width * 0.9, 840);
    const winH = parseFloat(win.style.height) || Math.min(workRect.height * 0.8, 560);
    const cx = Math.max(0, (workRect.width - winW) / 2);
    const cy = 16;
    if (!this.#overlapsAnyWindow(cx, cy, winW, winH)) {
      win.style.insetBlockStart = `${cy}px`; win.style.insetInlineStart = `${cx}px`; win.style.margin = '0';
      return;
    }
    const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
    win.style.insetBlockStart = `${Math.max(0, pos.y)}px`; win.style.insetInlineStart = `${pos.x}px`; win.style.margin = '0';
  }

  #overlapsAnyWindow(x: number, y: number, w: number, h: number): boolean {
    const parentRect = this.#windowsContainer.getBoundingClientRect();
    for (const win of this.host.querySelectorAll('gtk2-window')) {
      if (win.style.display === 'none') continue;
      const rect = win.getBoundingClientRect();
      const wx = rect.left - parentRect.left, wy = rect.top - parentRect.top;
      if (x < wx + rect.width && x + w > wx && y < wy + rect.height && y + h > wy) return true;
    }
    return false;
  }

  #findNextCascade(workW: number, workH: number, winW: number, winH: number) {
    const positions: { x: number; y: number }[] = [];
    const parentRect = this.#windowsContainer.getBoundingClientRect();
    for (const win of this.host.querySelectorAll('gtk2-window')) {
      if (win.style.display === 'none') continue;
      const rect = win.getBoundingClientRect();
      positions.push({ x: rect.left - parentRect.left, y: rect.top - parentRect.top });
    }
    positions.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    let cx = 0, cy = 0, stage = 0;
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (Math.abs(p.x - cx) < CASCADE_FUZZ && Math.abs(p.y - cy) < CASCADE_FUZZ) {
        cx = p.x + CASCADE_INTERVAL; cy = p.y + CASCADE_INTERVAL;
        if (cx + winW > workW || cy + winH > workH) { stage++; cx = CASCADE_INTERVAL * stage; cy = 0; i = -1; }
      }
    }
    return { x: cx, y: cy };
  }

  positionBackgroundWindows() {
    const activeWorkspace = this.getActiveWorkspace();
    const workRect = this.#windowsContainer.getBoundingClientRect();
    let bgIndex = 0;
    for (const win of this.host.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.windows.get(id);
      if (state?.appId) continue;
      if (state && state.workspace !== activeWorkspace) { win.style.display = 'none'; continue; }
      if (id === this.activeId) {
        win.style.zIndex = String(this.#topZ);
        if (state?.position) WMController.applyPosition(win, state);
      } else {
        win.style.zIndex = String(bgIndex + 1);
        if (state?.position) { WMController.applyPosition(win, state); }
        else {
          const winW = parseFloat(win.style.width) || 840, winH = parseFloat(win.style.height) || 560;
          const pos = this.#findNextCascade(workRect.width, workRect.height, winW, winH);
          win.style.insetBlockStart = `${Math.max(0, pos.y)}px`; win.style.insetInlineStart = `${pos.x}px`; win.style.margin = '0';
        }
        bgIndex++;
      }
    }
  }

  pinFocusedWindows(excludeId?: string) {
    const parentRect = this.#windowsContainer.getBoundingClientRect();
    for (const w of this.host.querySelectorAll<Gtk2Window>('gtk2-window[focused]')) {
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

  updateTaskbar() {
    const activeWorkspace = this.getActiveWorkspace();
    const entries: TaskbarEntry[] = [];
    for (const [id, state] of this.windows) {
      if (state.workspace !== activeWorkspace) continue;
      entries.push({ id, url: state.url, title: state.title, icon: state.icon, focused: id === this.activeId, minimized: state.minimized });
    }
    this.#options.onTaskbarChange(entries);
  }

  syncMiniatures() {
    const switcher = document.querySelector('gnome2-workspace-switcher');
    if (!switcher) return;
    switcher.active = this.getActiveWorkspace();
    const parentRect = this.#windowsContainer.getBoundingClientRect();
    const dw = parentRect.width || 1, dh = parentRect.height || 1;
    const minis: MiniWindow[] = [];
    for (const win of this.host.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.windows.get(id);
      const workspace = state?.workspace ?? 0, minimized = state?.minimized ?? false;
      if (win.style.display === 'none') {
        if (state?.position && state.position.width && state.position.height) {
          minis.push({ workspace, x: Math.max(0, state.position.x / dw), y: Math.max(0, state.position.y / dh), w: state.position.width / dw, h: state.position.height / dh, minimized });
        } else {
          const w = parseFloat(win.style.width) || 200, h = parseFloat(win.style.height) || 150;
          const x = parseFloat(win.style.insetInlineStart) || parseFloat(win.style.insetInlineEnd) || 40;
          const y = parseFloat(win.style.insetBlockStart) || 40;
          minis.push({ workspace, x: x / dw, y: y / dh, w: w / dw, h: h / dh, minimized });
        }
        continue;
      }
      const rect = win.getBoundingClientRect();
      minis.push({ workspace, x: Math.max(0, (rect.left - parentRect.left) / dw), y: Math.max(0, (rect.top - parentRect.top) / dh), w: rect.width / dw, h: rect.height / dh, minimized });
    }
    switcher.windows = minis;
  }

  applyWorkspaceVisibility() {
    const activeWorkspace = this.getActiveWorkspace();
    for (const win of this.host.querySelectorAll<Gtk2Window>('gtk2-window')) {
      const id = win.wmId || win.windowUrl;
      const state = this.windows.get(id);
      if (!state) continue;
      win.style.display = state.workspace !== activeWorkspace || state.minimized ? 'none' : '';
    }
  }

  // ─── Pointer tracking ────────────────────────────────────────

  onGotPointerCapture = () => { this.#tracking = true; };
  onLostPointerCapture = () => { this.#tracking = false; cancelAnimationFrame(this.#rafId); this.syncMiniatures(); };
  onPointerMove = () => { if (!this.#tracking) return; cancelAnimationFrame(this.#rafId); this.#rafId = requestAnimationFrame(() => this.syncMiniatures()); };
  onMaximize = () => { this.syncMiniatures(); };

  // ─── WM Event dispatcher ──────────────────────────────────────

  #onWmEvent = (e: Event) => {
    const { wmEventType, wmId, detail } = e as WMEvent;
    switch (wmEventType) {
      case 'focus': if (wmId) this.focusWindow(wmId); break;
      case 'restore': if (wmId) this.focusWindow(wmId); break;
      case 'minimize': if (wmId) this.toggleMinimize(wmId); break;
      case 'move': this.savePositions(); this.syncMiniatures(); break;
      case 'close': this.#handleClose(wmId); break;
      case 'show-desktop': this.#handleShowDesktop(detail.show as boolean); break;
      case 'workspace-switch': this.#handleWorkspaceSwitch(detail.workspace as number); break;
    }
  };

  #handleClose(wmId: string) {
    if (!wmId) return;
    const state = this.windows.get(wmId);
    const el = this.findWindowElement(wmId);
    this.unregisterWindow(wmId);
    if (el) el.remove();
    if (state?.appId) { try { sessionStorage.removeItem(`app-${state.appId}`); } catch {} }
    if (this.isMobile) {
      if (!state?.appId) {
        const closeHref = state?.closeHref || '/';
        if (closeHref !== location.pathname) location.href = closeHref;
      }
      this.sync(); return;
    }
    if (wmId === this.activeId) {
      const remaining = [...this.windows.keys()];
      if (remaining.length > 0) { this.focusWindow(remaining[remaining.length - 1], { animate: false }); }
      else { this.activeId = null; this.#options.onActiveWindowChange(undefined); }
    }
    this.sync();
  }

  #handleShowDesktop(show: boolean) {
    if (this.isMobile) return;
    const activeWs = this.getActiveWorkspace();
    for (const [id, state] of this.windows) {
      if (state.workspace === activeWs) {
        state.minimized = show;
        const el = this.findWindowElement(id);
        if (el) el.style.display = show ? 'none' : '';
      }
    }
    this.saveWindows(); this.sync();
  }

  #handleWorkspaceSwitch(workspace: number) {
    if (this.isMobile) return;
    this.saveActiveWorkspace(workspace);
    this.applyWorkspaceVisibility();
    this.sync();
  }
}
