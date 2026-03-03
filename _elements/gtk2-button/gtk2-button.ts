import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './gtk2-button.css';

/**
 * A push button modeled after GTK+ 2.20 GtkButton with Clearlooks theme
 * rendering. Use for triggering actions in dialogs, toolbars, or forms.
 * Renders a native `<button>` for keyboard and form accessibility.
 * Supports slotted icon and text content.
 *
 * @summary Clearlooks-themed push button
 */
@customElement('gtk2-button')
export class Gtk2Button extends LitElement {
  static styles = styles;

  /** When true, the button is non-interactive and visually dimmed */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  render() {
    return html`
      <!-- The native button element. Use to override padding, background, or font. -->
      <button ?disabled=${this.disabled} part="button">
        <!-- Button label content. SHOULD contain text. MAY include an icon img or svg alongside text. -->
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
