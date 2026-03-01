import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

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
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 2px 4px;
      gap: 2px;
    }

    #show-desktop {
      flex-shrink: 0;
      width: 24px;
      height: calc(100% - 2px);
      border: 1px solid light-dark(#9d9c9b, #1a1a1a);
      border-radius: 2px;
      background: linear-gradient(to bottom, light-dark(#fefefe, #4a4a4a), light-dark(#f0efee, #434343), light-dark(#e6e5e4, #3c3c3c), light-dark(#dadddb, #383838));
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);

      &:hover {
        background: linear-gradient(to bottom, light-dark(#ffffff, #555555), light-dark(#f5f4f3, #4d4d4d), light-dark(#edeceb, #464646), light-dark(#e4e3e2, #434343));
      }

      &:active,
      &.active {
        background: linear-gradient(to bottom, light-dark(#d4d3d2, #333333), light-dark(#dbdad9, #383838), light-dark(#e2e1e0, #3c3c3c), light-dark(#eaeae9, #404040));
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
      }

      svg {
        width: 14px;
        height: 14px;
        color: light-dark(#555753, #babdb6);
      }
    }

    .divider {
      flex-shrink: 0;
      display: flex;
      gap: 0;
      align-items: center;
      margin-inline: 3px;
      height: calc(100% - 6px);

      &::before,
      &::after {
        content: '';
        display: block;
        width: 1px;
        height: 100%;
      }

      &::before {
        background: light-dark(#9d9c9b, #1a1a1a);
      }

      &::after {
        background: light-dark(#ffffff, #555753);
      }
    }

    a {
      display: flex;
      align-items: center;
      gap: 4px;
      height: calc(100% - 2px);
      padding: 0 6px;
      background: linear-gradient(to bottom, light-dark(#fefefe, #4a4a4a), light-dark(#f0efee, #434343), light-dark(#e6e5e4, #3c3c3c), light-dark(#dadddb, #383838));
      border: 1px solid light-dark(#9d9c9b, #1a1a1a);
      border-radius: 2px;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size-small, 11px);
      color: var(--cl-panel-text, light-dark(#2e3436, #eeeeec));
      cursor: default;
      min-width: 0;
      max-width: 275px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      text-decoration: none;
      text-transform: capitalize;

      &.active {
        background: linear-gradient(to bottom, light-dark(#d4d3d2, #333333), light-dark(#dbdad9, #383838), light-dark(#e2e1e0, #3c3c3c), light-dark(#eaeae9, #404040));
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
        border-color: light-dark(#9d9c9b, #111111);
      }

      &.minimized {
        opacity: 0.7;
      }

      img {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }
    }
  `;

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
      <div class="divider"></div>
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
