import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gnome2-panel.css';

@customElement('gnome2-panel')
export class Gnome2Panel extends LitElement {
  static styles = styles;

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
