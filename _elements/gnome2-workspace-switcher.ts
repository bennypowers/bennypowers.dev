import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export class WMWorkspaceSwitchEvent extends Event {
  constructor(public workspace: number) {
    super('wm-workspace-switch', { bubbles: true, composed: true });
  }
}

export interface MiniWindow {
  workspace: number;
  /** 0–1 fraction of desktop width */
  x: number;
  /** 0–1 fraction of desktop height */
  y: number;
  /** 0–1 fraction of desktop width */
  w: number;
  /** 0–1 fraction of desktop height */
  h: number;
  minimized?: boolean;
}

@customElement('gnome2-workspace-switcher')
export class Gnome2WorkspaceSwitcher extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 1px;
      padding: 2px 4px;
      height: 100%;
      box-sizing: border-box;
      box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.08);
    }

    .workspace {
      width: 20px;
      height: 14px;
      border: 1px solid light-dark(#9d9c9b, #1a1a1a);
      background: transparent;
      box-sizing: border-box;
      box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.1);
      cursor: default;
      position: relative;
      overflow: hidden;
    }

    .workspace:hover:not(.active) {
      background: linear-gradient(to bottom, light-dark(#f0f3fa, #5a5a5a), light-dark(#86abd9, #3a6a9a));
    }

    .workspace.active {
      background: linear-gradient(to bottom, light-dark(#649abc, #2a5a8a), light-dark(#8fb7e4, #4a7aaa));
      border-color: light-dark(#6b7e95, #2a4a6a);
      box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.3);
    }

    .window-indicator {
      position: absolute;
      background: light-dark(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.4));
      border: 1px solid light-dark(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.5));
      box-sizing: border-box;
      min-width: 2px;
      min-height: 1px;
    }

    .window-indicator.minimized {
      opacity: 0.4;
    }
  `;

  @property({ type: Number }) accessor active = 0;
  @property({ type: Number }) accessor count = 4;
  @property({ type: Array }) accessor windows: MiniWindow[] = [];

  /** Inner dimensions of the workspace box (after border) */
  get #boxW() { return 18; }
  get #boxH() { return 12; }

  render() {
    return html`
      ${Array.from({ length: this.count }, (_, i) => {
        const wins = this.windows.filter(w => w.workspace === i);
        return html`
          <div class="workspace ${i === this.active ? 'active' : ''}"
               aria-label="Workspace ${i + 1}${i === this.active ? ' (active)' : ''}"
               @click=${() => this.#onWorkspaceClick(i)}>
            ${wins.map(w => html`
              <div class="window-indicator ${w.minimized ? 'minimized' : ''}"
                   style="left:${w.x * this.#boxW}px;top:${w.y * this.#boxH}px;width:${Math.max(2, w.w * this.#boxW)}px;height:${Math.max(1, w.h * this.#boxH)}px"></div>
            `)}
          </div>
        `;
      })}
    `;
  }

  #onWorkspaceClick(index: number) {
    if (index !== this.active) {
      this.dispatchEvent(new WMWorkspaceSwitchEvent(index));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-workspace-switcher': Gnome2WorkspaceSwitcher;
  }
}
