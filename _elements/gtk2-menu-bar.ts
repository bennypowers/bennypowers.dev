import { LitElement, html, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './gtk2-menu-bar.css';

@customElement('gtk2-menu-bar')
export class Gtk2MenuBar extends LitElement {
  static styles = styles;

  #internals = this.attachInternals();

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
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
