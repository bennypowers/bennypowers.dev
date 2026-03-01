import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './gnome2-desktop.css';

@customElement('gnome2-desktop')
export class Gnome2Desktop extends LitElement {
  static styles = styles;

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
