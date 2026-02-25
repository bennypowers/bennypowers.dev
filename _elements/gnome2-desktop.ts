import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('gnome2-desktop')
export class Gnome2Desktop extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background: var(--cl-desktop-bg, #305573);
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      color: var(--cl-button-text, #2e3436);
      overflow: hidden;
    }

    #workspace {
      display: flex;
      flex-direction: column;
      flex: 1;
      position: relative;
      min-height: 0;
    }

    #icons {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: 8px 4px;
      padding: 16px;
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    #icons ::slotted(*) {
      pointer-events: auto;
    }

    #windows {
      position: relative;
      z-index: 1;
      flex: 1;
      min-height: 0;
      pointer-events: none;

      ::slotted(gtk2-window) {
        pointer-events: auto;
        position: absolute;
        width: min(90%, 840px);
        height: min(80%, 560px);
        max-height: calc(100dvh - 120px);
      }

      ::slotted(gtk2-window[dialog]) {
        width: min(90%, 825px);
        height: min(90%, 730px);
      }

      ::slotted(gtk2-window[focused]) {
        inset-inline: 0;
        margin-inline: auto;
        inset-block-start: 16px;
      }

      ::slotted(gtk2-window[window-url="/latest/"]) {
        width: min(90%, 475px);
        height: min(80%, 410px);
      }

      ::slotted(gtk2-window[data-app="pidgin"]) {
        inset-inline-end: 16px;
        inset-inline-start: auto;
        inset-block-start: 40px;
        margin: 0;
        width: min(90%, 400px);
        height: min(80%, 500px);
      }
    }

    @media (max-width: 767px) {
      #icons {
        display: none;
      }

      #windows {
        display: flex;
        flex-direction: column;
      }

      #windows ::slotted(gtk2-window) {
        position: static;
        width: 100%;
        max-height: none;
        flex: 1;
      }

      #windows ::slotted(gtk2-window:not([focused])) {
        display: none;
      }
    }
  `;

  render() {
    return html`
      <slot name="top-panel"></slot>
      <div id="workspace" part="workspace">
        <div id="icons">
          <slot name="icons"></slot>
        </div>
        <div id="windows">
          <slot></slot>
        </div>
      </div>
      <slot name="bottom-panel"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-desktop': Gnome2Desktop;
  }
}
