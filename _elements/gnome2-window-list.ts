import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import styles from './gnome2-window-list.css';

import { taskbarContext, type TaskbarEntry } from './gnome2-wm-context.js';

export class WMMinimizeEvent extends Event {
  constructor(public url: string) {
    super('wm-minimize', { bubbles: true, cancelable: true });
  }
}

export class WMShowDesktopEvent extends Event {
  constructor(public show: boolean) {
    super('wm-show-desktop', { bubbles: true, composed: true });
  }
}

@customElement('gnome2-window-list')
export class Gnome2WindowList extends LitElement {
  static styles = styles;

  @consume({ context: taskbarContext, subscribe: true })
  @state()
  accessor entries: TaskbarEntry[] = [];

  /** Whether all windows are minimized (show desktop active) */
  @state() accessor desktopShown = false;

  protected override willUpdate(): void {
    // Ensure first render matches SSR — @consume won't have delivered yet
    // during the constructor-time hydration render.
    if (!this.entries.length) {
      const desktop = this.closest('gnome2-desktop');
      if (desktop && 'taskbarEntries' in desktop) {
        const entries = (desktop as any).taskbarEntries;
        if (entries?.length) {
          this.entries = entries;
        }
      }
    }
  }

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
      ${this.entries.map(({ url, title, icon, focused, minimized }) => html`
      <a class="${classMap({ active: focused, minimized })}"
         href=${ifDefined(url)}
         data-focused="${String(focused)}"
         @click=${this.#onButtonClick}>
        <img src="${ifDefined(icon ? `/assets/icons/gnome/${icon}.svg` : undefined)}"
             role="presentation"
             width="16"
             height="16">
        <span>${title}</span>
      </a>
    `)}`;
  }

  #onButtonClick(e: Event) {
    const target = (e.target as Element)?.closest('a');
    if (!target) return;
    const url = target.getAttribute('href') ?? '';
    if (target.dataset.focused === 'true') {
      e.preventDefault();
      this.dispatchEvent(new WMMinimizeEvent(url));
    } else {
      e.preventDefault();
      this.dispatchEvent(Object.assign(
        new Event('wm-focus', { bubbles: true, composed: true }),
        { url },
      ));
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
