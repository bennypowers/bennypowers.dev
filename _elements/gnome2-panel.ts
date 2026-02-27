import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('gnome2-panel')
export class Gnome2Panel extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      height: var(--cl-panel-height, 26px);
      background: var(--cl-panel-bg, linear-gradient(to bottom, #edeceb, #e6e5e4, #dddcdb, #cecdcb));
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      color: var(--cl-panel-text, #2e3436);
      box-sizing: border-box;
      flex-shrink: 0;
      z-index: 100;
    }

    :host([position="top"]) {
      border-top: 1px solid var(--cl-panel-border-top, #ffffff);
      border-bottom: 1px solid var(--cl-panel-border-bottom, #d0cfce);
    }

    :host([position="bottom"]) {
      border-top: 1px solid var(--cl-panel-border-top, #ffffff);
      border-bottom: 1px solid var(--cl-panel-border-bottom, #d0cfce);
    }

    #start {
      display: flex;
      align-items: center;
      height: 100%;
      flex: 0 0 auto;
    }

    #center {
      display: flex;
      align-items: center;
      height: 100%;
      flex: 1;
      min-width: 0;
    }

    #end {
      display: flex;
      align-items: center;
      height: 100%;
      flex: 0 0 auto;
      margin-inline-start: auto;
      gap: 2px;
      padding-inline-end: 4px;
    }

    @media (max-width: 767px) {
      :host([position="bottom"]) {
        display: none;
      }
    }
  `;

  @property({ reflect: true }) accessor position: 'top' | 'bottom' = 'top';

  render() {
    return html`
      <div id="start" part="start">
        <slot name="start"></slot>
      </div>
      <div id="center" part="center">
        <slot></slot>
      </div>
      <div id="end" part="end">
        <slot name="end"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-panel': Gnome2Panel;
  }
}
