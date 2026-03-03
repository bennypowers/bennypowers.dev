import { LitElement, html, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './gtk2-menu-bar.css';

/**
 * A horizontal menu bar modeled after GTK+ 2.20 GtkMenuBar. Use as the
 * top-level menu container in window menubars or panel applets. Sets
 * `role="menubar"` via ElementInternals. MUST contain `gtk2-menu-button`
 * children for dropdown menus.
 *
 * @summary GTK-style horizontal menu bar
 */
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
    return html`<!-- Menu bar content (gtk2-menu-button elements). MUST contain gtk2-menu-button children. Each button provides keyboard-accessible dropdown menus with ARIA roles. --><slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-menu-bar': Gtk2MenuBar;
  }
}
