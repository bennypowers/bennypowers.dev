import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './gtk2-button.css';

@customElement('gtk2-button')
export class Gtk2Button extends LitElement {
  static styles = styles;

  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  render() {
    return html`
      <button ?disabled=${this.disabled} part="button">
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-button': Gtk2Button;
  }
}
