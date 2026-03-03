import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gtk2-scrolled-window.css';

/**
 * A scrollable container modeled after GTK+ 2.20 GtkScrolledWindow.
 * Provides Clearlooks-themed scrollbar tracks and thumbs for content
 * overflow. SHOULD use `hscrollbar` and `vscrollbar` to control
 * which axes allow scrolling. AVOID nesting multiple scrollable
 * containers for usability.
 *
 * @summary GTK-style scrollable container with themed scrollbars
 */
@customElement('gtk2-scrolled-window')
export class Gtk2ScrolledWindow extends LitElement {
  static styles = styles;

  /** Whether horizontal scrolling is enabled */
  @property({ type: Boolean }) accessor hscrollbar = true;

  /** Whether vertical scrolling is enabled */
  @property({ type: Boolean }) accessor vscrollbar = true;

  render() {
    return html`
      <!-- The scrollable viewport. Use to override padding. -->
      <div id="viewport" part="viewport">
        <!-- Scrollable content. Accepts any block or inline elements. Focus order follows DOM order; scrollable region is accessible via keyboard. -->
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
