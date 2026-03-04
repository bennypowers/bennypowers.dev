import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-workspace-switcher.css';

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

/**
 * A workspace switcher applet modeled after GNOME 2.20. Provides
 * miniature workspace previews with proportionally-scaled window
 * indicators. SHOULD be placed in the bottom panel's `end` slot.
 * Allows workspace switching when the user clicks a preview.
 *
 * @summary GNOME 2 workspace switcher with miniature previews
 *
 * @fires {WMEvent} wm-event - workspace-switch: When a workspace is clicked. Detail: `workspace` number (zero-based index).
 */
@customElement('gnome2-workspace-switcher')
export class Gnome2WorkspaceSwitcher extends LitElement {
  static styles = styles;

  /** Zero-based index of the active workspace */
  @property({ type: Number }) accessor active = 0;

  /** Total number of workspaces to display */
  @property({ type: Number }) accessor count = 4;

  /** Window position data for rendering miniature indicators in each workspace */
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
      this.dispatchEvent(new WMEvent('workspace-switch', '', '', { workspace: index }));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-workspace-switcher': Gnome2WorkspaceSwitcher;
  }
}
