import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './desktop-icon.css';

@customElement('desktop-icon')
export class DesktopIcon extends LitElement {
  static styles = styles;

  @property() accessor label = '';
  @property() accessor href = '';
  @property() accessor icon = '';

  render() {
    return html`
      <a href=${this.href} draggable="false">
        <div id="icon">
          ${this.icon
            ? html`<img src=${this.icon} alt="" draggable="false" />`
            : html`<slot name="icon"></slot>`
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
