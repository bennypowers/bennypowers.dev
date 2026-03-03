import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './ooo-impress-deck.css';

/**
 * An Impress slide deck thumbnail card. Provides a linked thumbnail
 * image with title label. SHOULD be placed inside `ooo-impress`.
 * Shows a "DRAFT" badge overlay when `draft` is set.
 *
 * @summary Impress slide deck thumbnail card
 */
@customElement('ooo-impress-deck')
export class OooImpressDeck extends LitElement {
  static styles = styles;

  /** Link to the full presentation */
  @property() accessor href = '';

  /** Thumbnail image URL for the slide deck preview */
  @property() accessor src = '';

  /** Presentation title displayed below the thumbnail */
  @property() accessor label = '';

  /** When true, shows a "DRAFT" badge overlay on the thumbnail */
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
