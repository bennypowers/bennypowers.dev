import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './ooo-impress-deck.css';

@customElement('ooo-impress-deck')
export class OooImpressDeck extends LitElement {
  static styles = styles;

  @property() accessor href = '';
  @property() accessor src = '';
  @property() accessor label = '';
  @property({ type: Boolean, reflect: true }) accessor draft = false;

  render() {
    return html`
      <a href="${this.href}">
        <img src="${this.src}"
             alt="${this.label}"
             loading="lazy"
             width="200"
             height="120">
        <span>${this.label}</span>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ooo-impress-deck': OooImpressDeck;
  }
}
