import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import styles from './gnome2-window-list.css';

import { WMEvent } from '../lib/wm-event.js';
import { taskbarContext, type TaskbarEntry } from '../gnome2-wm-context/gnome2-wm-context.js';

/**
 * A taskbar applet modeled after the GNOME 2.20 window-list. Provides
 * buttons for each open window, allowing focus, minimize, and restore.
 * SHOULD be placed in the bottom panel's default slot. Subscribes to
 * `taskbarContext` from `gnome2-desktop` for window state.
 *
 * @summary GNOME 2 window list taskbar applet
 *
 * @fires {WMEvent} wm-event - minimize: When a focused entry is clicked. Detail: `wmId`, `url`.
 * @fires {WMEvent} wm-event - restore: When a minimized entry is clicked. Detail: `wmId`.
 * @fires {WMEvent} wm-event - focus: When an unfocused entry is clicked. Detail: `wmId`, `url`.
 * @fires {WMEvent} wm-event - show-desktop: When show desktop is toggled. Detail: `show` boolean.
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
        this.dispatchEvent(new WMEvent('restore', wmId));
      } else if (wmFocused === 'true') {
        this.dispatchEvent(new WMEvent('minimize', wmId, wmUrl));
      } else {
        this.dispatchEvent(new WMEvent('focus', wmId, wmUrl));
      }
    }
  }

  #onShowDesktop() {
    this.desktopShown = !this.desktopShown;
    this.dispatchEvent(new WMEvent('show-desktop', '', '', { show: this.desktopShown }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-window-list': Gnome2WindowList;
  }
}
