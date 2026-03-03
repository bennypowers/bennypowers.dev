import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import styles from './gnome2-window-list.css';

import { WMFocusEvent } from './gtk2-window.js';
import { taskbarContext, type TaskbarEntry } from './gnome2-wm-context.js';

/** Dispatched when a window should be minimized to the taskbar. Provides `wmId` for identifying the target window. */
export class WMMinimizeEvent extends Event {
  wmId: string;
  url: string;
  constructor(wmId: string, url?: string) {
    super('wm-minimize', { bubbles: true, composed: true });
    this.wmId = wmId;
    this.url = url ?? wmId;
  }
}

/** Dispatched when a minimized window should be restored and focused. Provides `wmId` for identifying the target window. */
export class WMRestoreEvent extends Event {
  wmId: string;
  constructor(wmId: string) {
    super('wm-restore', { bubbles: true, composed: true });
    this.wmId = wmId;
  }
}

/** Dispatched when all windows should be minimized or restored to show/hide the desktop. Provides `show` boolean for the desired state. */
export class WMShowDesktopEvent extends Event {
  constructor(public show: boolean) {
    super('wm-show-desktop', { bubbles: true, composed: true });
  }
}

/**
 * A taskbar applet modeled after the GNOME 2.20 window-list. Provides
 * buttons for each open window, allowing focus, minimize, and restore.
 * SHOULD be placed in the bottom panel's default slot. Subscribes to
 * `taskbarContext` from `gnome2-desktop` for window state.
 *
 * @summary GNOME 2 window list taskbar applet
 *
 * @fires {WMMinimizeEvent} wm-minimize - When a focused entry is clicked. Detail: `wmId`, `url`.
 * @fires {WMRestoreEvent} wm-restore - When a minimized entry is clicked. Detail: `wmId`.
 * @fires {WMFocusEvent} wm-focus - When an unfocused entry is clicked. Detail: `wmId`, `url`.
 * @fires {WMShowDesktopEvent} wm-show-desktop - When show desktop is toggled. Detail: `show` boolean.
 */
@customElement('gnome2-window-list')
export class Gnome2WindowList extends LitElement {
  static styles = styles;

  @consume({ context: taskbarContext, subscribe: true })
  @state()
  accessor entries: TaskbarEntry[] = [];

  /** Whether all windows are minimized (show desktop active) */
  @state() accessor desktopShown = false;

  render() {
    return html`
      <button id="show-desktop"
              class="${classMap({ active: this.desktopShown })}"
              title="Show Desktop"
              @click=${this.#onShowDesktop}>
        <img alt="show desktop"
             src="/assets/icons/gnome/places/user-desktop.svg"
             width="16"
             height="16">
      </button>
      <div id="divider"></div>
      ${this.entries.map(({ id, url, title, icon, focused, minimized }) => html`
      <button class="${classMap({ active: focused, minimized, 'wm-entry': true })}"
              data-wm-id="${id}"
              data-wm-url="${url}"
              data-wm-focused="${String(Boolean(focused))}"
              data-wm-minimized="${String(Boolean(minimized))}"
              @click=${this.#onEntryClick}>
        <img src="${ifDefined(icon ? `/assets/icons/gnome/${icon}.svg` : undefined)}"
             role="presentation"
             width="16"
             height="16">
        <span>${title}</span>
      </button>
    `)}`;
  }

  #onEntryClick(event: MouseEvent) {
    if (event.currentTarget instanceof HTMLButtonElement) {
      const { wmId, wmUrl, wmFocused, wmMinimized } = event.currentTarget.dataset;
      if (wmMinimized === 'true') {
        this.dispatchEvent(new WMRestoreEvent(wmId));
      } else if (wmFocused === 'true') {
        this.dispatchEvent(new WMMinimizeEvent(wmId, wmUrl));
      } else {
        this.dispatchEvent(new WMFocusEvent(wmId, wmUrl));
      }
    }
  }

  #onShowDesktop() {
    this.desktopShown = !this.desktopShown;
    this.dispatchEvent(new WMShowDesktopEvent(this.desktopShown));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-window-list': Gnome2WindowList;
  }
}
