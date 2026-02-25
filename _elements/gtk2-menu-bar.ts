import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('gtk2-menu-bar')
export class Gtk2MenuBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: stretch;
      height: 100%;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      color: var(--cl-panel-text, #2e3436);
    }
  `;

  #internals = this.attachInternals();

  connectedCallback() {
    super.connectedCallback();
    this.#internals.role = 'menubar';
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu-bar': Gtk2MenuBar;
  }
}
