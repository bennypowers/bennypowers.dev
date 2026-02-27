// GNOME 2 Window Manager
// Manages multi-window state via sessionStorage and fetch-inject

import type { WMMinimizeEvent, WMShowDesktopEvent } from "./gnome2-window-list.js";
import type { WMFocusEvent, WMCloseEvent } from "./gtk2-window.js";
import type { WMWorkspaceSwitchEvent, MiniWindow } from "./gnome2-workspace-switcher.js";

interface WindowEntry {
  url?: string;
  title: string;
  icon?: string;
  minimized: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maximized?: boolean;
  workspace: number;
}

const STORAGE_KEY = 'gnome2-wm-windows';
const WORKSPACE_KEY = 'gnome2-wm-workspace';
const CASCADE_OFFSET = 24;

function getActiveWorkspace(): number {
  try {
    return parseInt(sessionStorage.getItem(WORKSPACE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveActiveWorkspace(index: number) {
  try {
    sessionStorage.setItem(WORKSPACE_KEY, String(index));
  } catch {}
}

function getWindows(): WindowEntry[] {
  try {
    const entries: WindowEntry[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    // Ensure all entries have a workspace field
    for (const entry of entries) {
      if (entry.workspace == null) entry.workspace = 0;
    }
    return entries;
  } catch {
    return [];
  }
}

function saveWindows(entries: WindowEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function addWindow(url: string, title: string, icon?: string): WindowEntry[] {
  const entries = getWindows();
  const existing = entries.find(e => e.url === url);
  if (existing) {
    existing.title = title;
    existing.minimized = false;
    if (icon) existing.icon = icon;
  } else {
    entries.push({ url, title, icon, minimized: false, workspace: getActiveWorkspace() });
  }
  saveWindows(entries);
  return entries;
}

function removeWindow(url: string): WindowEntry[] {
  const entries = getWindows().filter(e => e.url !== url);
  saveWindows(entries);
  return entries;
}

function toggleMinimize(url: string): WindowEntry[] {
  const entries = getWindows();
  const entry = entries.find(e => e.url === url);
  if (entry) entry.minimized = !entry.minimized;
  saveWindows(entries);
  return entries;
}

/** Save current window positions before navigation */
function savePositions(desktop: Element) {
  const entries = getWindows();
  const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
  // Get the workspace rect to compute relative positions
  // The windows are slotted into gnome2-desktop's #windows div
  const desktopShadow = (desktop as any).shadowRoot;
  const workspace = desktopShadow?.querySelector('#windows') ?? desktop;
  const parentRect = workspace.getBoundingClientRect();
  for (const win of windows) {
    const url = win.getAttribute('window-url');
    const entry = entries.find(e => e.url === url);
    if (!entry) continue;
    const rect = win.getBoundingClientRect();
    // Save position relative to the offset parent, not the viewport
    entry.x = rect.left - parentRect.left;
    entry.y = rect.top - parentRect.top;
    entry.width = rect.width;
    entry.height = rect.height;
    entry.maximized = win.hasAttribute('maximized');
  }
  saveWindows(entries);
}

function applyPosition(win: HTMLElement, entry: WindowEntry) {
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

async function fetchWindowContent(url: string): Promise<Element | null> {
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

function updateTaskbar(entries: WindowEntry[], currentUrl: string) {
  const activeWorkspace = getActiveWorkspace();
  const windowList = document.querySelector('gnome2-window-list');
  if (!windowList) return;
  (windowList as any).entries = entries
    .filter(e => e.workspace === activeWorkspace)
    .map(e => ({
      url: e.url,
      title: e.title,
      icon: e.icon,
      focused: e.url === currentUrl,
      minimized: e.minimized,
    }));
}

function syncMiniatures(desktop: Element, entries: WindowEntry[]) {
  const switcher = document.querySelector('gnome2-workspace-switcher') as any;
  if (!switcher) return;
  const activeWs = getActiveWorkspace();
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
      const entry = entries.find(e => e.url === url);
      if (!entry) continue;
      workspace = entry.workspace;
      minimized = entry.minimized;
    }

    // Hidden windows (other workspace or minimized) return a zero rect,
    // so use stored entry data instead of live getBoundingClientRect
    if (win.style.display === 'none') {
      const entry = !appId ? entries.find(e => e.url === url) : undefined;
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
        // App windows or entries without saved position — use inline style
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

function applyWorkspaceVisibility(desktop: Element, entries: WindowEntry[], currentUrl: string) {
  const activeWorkspace = getActiveWorkspace();
  const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
  for (const win of windows) {
    const url = win.getAttribute('window-url');
    // Handle app windows (calculator, mines, about)
    const appId = win.getAttribute('data-app');
    if (appId) {
      const appWorkspace = parseInt(win.getAttribute('data-workspace') || '0', 10);
      win.style.display = appWorkspace === activeWorkspace ? '' : 'none';
      continue;
    }
    const entry = entries.find(e => e.url === url);
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

function positionBackgroundWindows(desktop: Element, entries: WindowEntry[], currentUrl: string) {
  const activeWorkspace = getActiveWorkspace();
  const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
  let bgIndex = 0;
  for (const win of windows) {
    const url = win.getAttribute('window-url');
    const entry = entries.find(e => e.url === url);

    // Skip app windows — handled by applyWorkspaceVisibility
    if (win.hasAttribute('data-app')) continue;

    // Hide windows not on the active workspace
    if (entry && entry.workspace !== activeWorkspace) {
      win.style.display = 'none';
      continue;
    }

    if (url === currentUrl) {
      win.style.zIndex = '100';
      if (entry?.x != null) {
        applyPosition(win, entry);
      }
    } else {
      win.style.zIndex = String(bgIndex + 1);
      if (entry?.x != null) {
        // Restore saved position
        applyPosition(win, entry);
      } else {
        // Cascade new windows
        win.style.insetBlockStart = `${16 + bgIndex * CASCADE_OFFSET}px`;
        win.style.insetInlineStart = `${bgIndex * CASCADE_OFFSET}px`;
      }
      bgIndex++;
    }
  }
}

async function init() {
  if (matchMedia('(max-width: 767px)').matches) return;

  const desktop = document.querySelector('gnome2-desktop');
  if (!desktop) return;

  const currentWindow = desktop.querySelector('gtk2-window') as HTMLElement | null;
  const currentUrl = location.pathname;
  const currentTitle = currentWindow?.getAttribute('label') || document.title;
  const currentIcon = currentWindow?.getAttribute('icon') || undefined;

  // Register current page
  let entries: WindowEntry[];
  if (currentWindow) {
    currentWindow.setAttribute('window-url', currentUrl);
    entries = addWindow(currentUrl, currentTitle, currentIcon);
  } else {
    entries = getWindows();
  }

  // Ensure current window is on the active workspace
  const activeWorkspace = getActiveWorkspace();
  const currentEntry = entries.find(e => e.url === currentUrl);
  if (currentEntry && currentEntry.workspace !== activeWorkspace) {
    // The user navigated to this window, so switch to its workspace
    saveActiveWorkspace(currentEntry.workspace);
  }

  // Fetch and inject background windows
  for (const entry of entries) {
    if (entry.url === currentUrl) continue;

    // Pidgin windows are page-specific SSR content, not fetchable
    if (entry.url?.startsWith('pidgin:')) {
      entries = removeWindow(entry.url);
      continue;
    }

    const sourceWindow = await fetchWindowContent(entry.url);
    if (!sourceWindow) {
      entries = removeWindow(entry.url);
      continue;
    }

    const windowEl = document.createElement('gtk2-window');
    windowEl.setAttribute('label', entry.title);
    windowEl.setAttribute('window-url', entry.url);
    windowEl.setAttribute('close-href', '/');
    if (entry.icon) windowEl.setAttribute('icon', entry.icon);
    windowEl.removeAttribute('focused');
    windowEl.innerHTML = sourceWindow.innerHTML;

    if (entry.minimized || entry.workspace !== getActiveWorkspace()) {
      windowEl.style.display = 'none';
    }

    desktop.appendChild(windowEl);
  }

  positionBackgroundWindows(desktop, entries, currentUrl);
  updateTaskbar(entries, currentUrl);
  syncMiniatures(desktop, entries);

  // Remove the blocking script's initial position style — inline styles now handle it
  document.getElementById('gnome2-wm-initial-pos')?.remove();

  // Save positions before any navigation
  // Use multiple events for cross-browser compatibility
  window.addEventListener('pagehide', () => savePositions(desktop));
  document.addEventListener('pageswap', () => savePositions(desktop));
  // Also save on any link click that will cause navigation
  document.addEventListener('click', (e) => {
    const link = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (link && link.href && !link.href.startsWith('javascript:')) {
      savePositions(desktop);
    }
  }, { capture: true });

  // Listen for WM events
  desktop.addEventListener('wm-close', ((e: WMCloseEvent) => {
    if (!e.url) return;
    entries = removeWindow(e.url);
    const win = desktop.querySelector(`gtk2-window[window-url="${CSS.escape(e.url)}"]`);
    if (win) win.remove();
    updateTaskbar(entries, currentUrl);
    syncMiniatures(desktop, entries);
  }) as EventListener);

  desktop.addEventListener('wm-minimize', ((e: WMMinimizeEvent) => {
    if (!e.url) return;
    entries = toggleMinimize(e.url);
    const win = desktop.querySelector(`gtk2-window[window-url="${CSS.escape(e.url)}"]`) as HTMLElement | null;
    if (win) {
      const entry = entries.find(en => en.url === e.url);
      win.style.display = entry?.minimized ? 'none' : '';
    }
    updateTaskbar(entries, currentUrl);
    syncMiniatures(desktop, entries);
  }) as EventListener);

  desktop.addEventListener('wm-focus', ((e: WMFocusEvent) => {
    if (!e.url) return;
    // For pseudo-URLs or the current page URL, focus in place without navigation
    if (e.url.includes(':') || e.url === currentUrl) {
      const allWindows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
      const desktopShadow = (desktop as any).shadowRoot;
      const container = desktopShadow?.querySelector('#windows') ?? desktop;
      const parentRect = container.getBoundingClientRect();
      // Pin each focused window's CSS position before unfocusing.
      // getBoundingClientRect includes the drag transform, so subtract it
      // to get the CSS-only position. The transform stays intact on the element.
      for (const w of allWindows) {
        if (w.hasAttribute('focused')) {
          const rect = w.getBoundingClientRect();
          const tx = new DOMMatrix(getComputedStyle(w).transform);
          w.style.insetBlockStart = `${rect.top - parentRect.top - tx.m42}px`;
          w.style.insetInlineStart = `${rect.left - parentRect.left - tx.m41}px`;
          w.style.margin = '0';
          w.removeAttribute('focused');
        }
      }
      const win = desktop.querySelector(`gtk2-window[window-url="${CSS.escape(e.url)}"]`) as HTMLElement | null;
      if (win) {
        win.style.zIndex = '200';
        win.setAttribute('focused', '');
      }
      return;
    }
    savePositions(desktop);
    location.href = e.url;
  }) as EventListener);

  desktop.addEventListener('wm-show-desktop', ((e: WMShowDesktopEvent) => {
    const windows = desktop.querySelectorAll('gtk2-window') as NodeListOf<HTMLElement>;
    const activeWs = getActiveWorkspace();
    for (const win of windows) {
      const url = win.getAttribute('window-url');
      const appId = win.getAttribute('data-app');
      // Only affect windows on the active workspace
      if (appId) {
        const appWs = parseInt(win.getAttribute('data-workspace') || '0', 10);
        if (appWs === activeWs) win.style.display = e.show ? 'none' : '';
      } else {
        const entry = entries.find(en => en.url === url);
        if (entry && entry.workspace === activeWs) {
          win.style.display = e.show ? 'none' : '';
        }
      }
    }
    for (const entry of entries) {
      if (entry.workspace === activeWs) {
        entry.minimized = e.show;
      }
    }
    saveWindows(entries);
    updateTaskbar(entries, currentUrl);
    syncMiniatures(desktop, entries);
  }) as EventListener);

  desktop.addEventListener('wm-workspace-switch', ((e: WMWorkspaceSwitchEvent) => {
    saveActiveWorkspace(e.workspace);
    applyWorkspaceVisibility(desktop, entries, currentUrl);
    updateTaskbar(entries, currentUrl);
    syncMiniatures(desktop, entries);
  }) as EventListener);

  // Real-time miniature updates during drag/resize
  let tracking = false;
  let rafId = 0;
  desktop.addEventListener('gotpointercapture', () => { tracking = true; }, true);
  desktop.addEventListener('lostpointercapture', () => {
    tracking = false;
    cancelAnimationFrame(rafId);
    syncMiniatures(desktop, entries);
  }, true);
  desktop.addEventListener('pointermove', () => {
    if (!tracking) return;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => syncMiniatures(desktop, entries));
  }, true);

  // Update miniatures on maximize/unmaximize
  desktop.addEventListener('maximize', () => {
    syncMiniatures(desktop, entries);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
