import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './desktop-icon.css';

/**
 * A desktop shortcut icon modeled after GNOME 2.20 Nautilus desktop
 * icons. Provides a 48x48 icon above a text label, wrapped in a
 * focusable link for keyboard and screen reader accessibility. SHOULD
 * use the `icon` attribute for an image URL. MUST be placed in
 * `gnome2-desktop`'s `icons` slot.
 *
 * @summary GNOME 2 desktop shortcut icon
 */
@customElement('desktop-icon')
export class DesktopIcon extends LitElement {
  static styles = styles;

  /** Text label displayed below the icon */
  @property() accessor label = '';

  /** Link destination URL for the icon shortcut */
  @property() accessor href = '';

  /** URL path to the icon image. When empty, the `icon` slot is used instead. */
  @property() accessor icon = '';

  render() {
    return html`
      <a href=${this.href} draggable="false">
        <div id="icon">
          ${this.icon
            ? html`<img src=${this.icon} alt="" draggable="false" />`
            : html`<!-- Custom icon element when the icon attribute is not set. SHOULD be 48x48. MUST have meaningful alt text for screen readers. --><slot name="icon"></slot>`
          }
        </div>
        <div id="label">${this.label}</div>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-icon': DesktopIcon;
  }
}
