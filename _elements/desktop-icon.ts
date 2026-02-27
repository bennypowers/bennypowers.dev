import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('desktop-icon')
export class DesktopIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: 80px;
      cursor: pointer;
      text-decoration: none;
    }

    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: inherit;
      padding: 6px;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
    }

    a:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    a:focus-visible {
      outline: 1px dotted #ffffff;
      outline-offset: -1px;
      background: rgba(255, 255, 255, 0.15);
    }

    .icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-block-end: 4px;
    }

    .icon img,
    .icon ::slotted(*) {
      width: 48px;
      height: 48px;
    }

    .label {
      color: var(--cl-desktop-icon-text, #ffffff);
      text-shadow: var(--cl-desktop-icon-text-shadow, 1px 1px 2px rgba(0, 0, 0, 0.7));
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size-small, 11px);
      text-align: center;
      word-break: break-word;
      line-height: 1.3;
    }

    @media (max-width: 767px) {
      :host {
        display: none;
      }
    }
  `;

  @property() accessor label = '';
  @property() accessor href = '';
  @property() accessor icon = '';

  render() {
    return html`
      <a href=${this.href} draggable="false">
        <div class="icon">
          ${this.icon
            ? html`<img src=${this.icon} alt="" draggable="false" />`
            : html`<slot name="icon"></slot>`
          }
        </div>
        <div class="label">${this.label}</div>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-icon': DesktopIcon;
  }
}
