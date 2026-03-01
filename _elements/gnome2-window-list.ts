import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import styles from './gnome2-window-list.css';

interface TaskbarEntry {
  url: string;
  title: string;
  icon?: string;
  focused: boolean;
  minimized: boolean;
}

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

  /** No-JS fallback: single window title from SSR */
  @property({ attribute: 'window-title' }) accessor windowTitle = '';

  /** No-JS fallback: single window icon from SSR */
  @property({ attribute: 'window-icon' }) accessor windowIcon = '';

  /** Set by the WM at runtime */
  @state() accessor entries: TaskbarEntry[] = [];

  /** Whether all windows are minimized (show desktop active) */
  @state() accessor desktopShown = false;

  /** Merged list: WM entries if available, otherwise fallback from attribute */
  get #buttons(): TaskbarEntry[] {
    if (this.entries.length)
      return this.entries;
    else if (!this.windowTitle)
      return []
    else
      return [{
        url: undefined,
        title: this.windowTitle,
        icon: this.windowIcon || undefined,
        focused: true,
        minimized: false,
      }];
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
      ${this.#buttons.map(({ url, title, icon, focused, minimized }) => html`
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
      // Prevent navigation for pseudo-URLs (app:*) — dispatch focus event instead
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
