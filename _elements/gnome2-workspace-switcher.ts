import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gnome2-workspace-switcher.css';

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
  static styles = styles;

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
