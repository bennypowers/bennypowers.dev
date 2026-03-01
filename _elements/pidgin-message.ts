import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './pidgin-message.css';

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `(${h12}:${m}:${s} ${ampm})`;
}

@customElement('pidgin-message')
export class PidginMessage extends LitElement {
  static styles = styles;

  /** reply | like | repost */
  @property() accessor type: 'reply' | 'like' | 'repost' = 'reply';
  @property() accessor timestamp = '';
  @property() accessor url = '';
  @property({ attribute: 'author-name' }) accessor authorName = '';
  @property({ attribute: 'author-url' }) accessor authorUrl = '';
  get #ts() {
    return formatTime(this.timestamp);
  }

  #renderTimestamp() {
    return this.url
      ? html`<a id="timestamp" href=${this.url} target="_blank" rel="noopener">${this.#ts}</a>`
      : html`<span id="timestamp">${this.#ts}</span>`;
  }

  render() {
    switch (this.type) {
      case 'reply':
        return html`
          ${this.#renderTimestamp()}
          <a id="sender" href=${this.authorUrl}
             target="_blank" rel="noopener">${this.authorName}:</a>
          <span id="body"><slot></slot></span>`;
      case 'like':
        return html`
          ${this.#renderTimestamp()}
          <span id="action-text">
            <a href=${this.authorUrl}
               target="_blank" rel="noopener">${this.authorName}</a> likes this
          </span>`;
      case 'repost':
        return html`
          ${this.#renderTimestamp()}
          <span id="action-text">
            <a href=${this.authorUrl}
               target="_blank" rel="noopener">${this.authorName}</a> shared this
          </span>`;
      default:
        return nothing;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pidgin-message': PidginMessage;
  }
}
