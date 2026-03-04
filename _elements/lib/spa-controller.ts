import type { ReactiveController, ReactiveElement } from 'lit';
import type { Gtk2Window } from '../gtk2-window/gtk2-window.js';
import type { WMController } from './wm-controller.js';
import { fromComposed } from './from-composed.js';

/** Generate a CSS-safe view-transition-name from a window URL. */
export function vtName(url: string) {
  return `wm-${url.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

/** Fetch a page and extract its gtk2-window content. */
export async function fetchWindowContent(url: string): Promise<Element | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const sourceWindow = doc.querySelector('gtk2-window');
    if (!sourceWindow) return null;
    for (const script of sourceWindow.querySelectorAll('script')) script.remove();
    return sourceWindow;
  } catch {
    return null;
  }
}

export interface SPAControllerOptions {
  wm: WMController;
}

/**
 * Reactive controller for SPA-style window navigation.
 * Intercepts link clicks, fetches page content, and injects
 * into managed gtk2-window elements.
 */
export class SPAController implements ReactiveController {
  #wm: WMController;

  constructor(private host: ReactiveElement & HTMLElement, options: SPAControllerOptions) {
    this.#wm = options.wm;
    host.addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}

  attach() {
    window.addEventListener('pagehide', this.#onPageHide);
    document.addEventListener('pageswap', this.#onPageSwap);
    document.addEventListener('click', this.#onLinkClick, { capture: true });
    window.addEventListener('popstate', this.#onPopState);
  }

  detach() {
    window.removeEventListener('pagehide', this.#onPageHide);
    document.removeEventListener('pageswap', this.#onPageSwap);
    document.removeEventListener('click', this.#onLinkClick, { capture: true });
    window.removeEventListener('popstate', this.#onPopState);
  }

  #onPageHide = () => this.#wm.savePositions();
  #onPageSwap = () => this.#wm.savePositions();

  #onLinkClick = (e: MouseEvent) => {
    if (this.#wm.isMobile) return;
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    const link = fromComposed(e, 'a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    if (link.closest('#titlebar-buttons')) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.origin !== location.origin) return;
    e.preventDefault();
    this.openWindow(link.pathname);
  };

  #onPopState = () => {
    if (this.#wm.isMobile) return;
    const url = location.pathname;
    const existing = this.#wm.findWindowElement(url);
    if (existing) {
      this.#wm.focusWindow(url, { animate: false });
    } else {
      location.reload();
    }
  };

  async openWindow(url: string) {
    const wmId = url;
    const existing = this.#wm.findWindowElement(wmId);
    if (existing) {
      this.#wm.focusWindow(wmId);
      history.pushState(null, '', url);
      return;
    }

    const sourceWindow = await fetchWindowContent(url);
    if (!sourceWindow) {
      this.#wm.savePositions();
      location.href = url;
      return;
    }

    const title = sourceWindow.getAttribute('label') || url;
    const icon = sourceWindow.getAttribute('icon') || undefined;
    const closeHref = sourceWindow.getAttribute('close-href') || '/';

    if (!this.#wm.isMobile) this.#wm.pinFocusedWindows();

    this.#wm.registerWindow(wmId, {
      url, title, icon, minimized: false, maximized: false,
      workspace: this.#wm.getActiveWorkspace(), closeHref,
    });

    const windowEl = document.createElement('gtk2-window') as Gtk2Window;
    windowEl.label = title;
    windowEl.windowUrl = url;
    windowEl.closeHref = closeHref;
    windowEl.style.viewTransitionName = vtName(url);
    if (icon) windowEl.icon = icon;
    windowEl.innerHTML = sourceWindow.innerHTML;

    this.#wm.placeWindow(windowEl, wmId);
    this.host.appendChild(windowEl);
    this.#wm.focusWindow(wmId, { animate: false });
    history.pushState(null, '', url);
  }
}
