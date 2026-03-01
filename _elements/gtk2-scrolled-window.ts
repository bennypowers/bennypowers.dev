import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-scrolled-window.css';

@customElement('gtk2-scrolled-window')
export class Gtk2ScrolledWindow extends LitElement {
  static styles = styles;

  @property({ type: Boolean }) accessor hscrollbar = true;
  @property({ type: Boolean }) accessor vscrollbar = true;

  render() {
    return html`
      <div id="viewport" part="viewport">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hscrollbar) this.style.overflowX = 'hidden';
    if (!this.vscrollbar) this.style.overflowY = 'hidden';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-scrolled-window': Gtk2ScrolledWindow;
  }
}
