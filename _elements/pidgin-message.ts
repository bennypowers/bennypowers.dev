import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
  static styles = css`
    :host {
      display: block;
      margin-bottom: 2px;
      word-wrap: break-word;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      line-height: 1.4;
    }

    .timestamp {
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#888a85, #888a85);
      margin-right: 4px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .sender {
      font-weight: 700;
      color: light-dark(#cc0000, #ef2929);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .body {
      color: var(--cl-text, light-dark(#2e3436, #eeeeec));
    }

    .body a {
      color: light-dark(#000080, #729fcf);
    }

    .action-text {
      color: light-dark(#062585, #729fcf);
      font-style: italic;

      a {
        color: inherit;
        font-weight: 700;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `;

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
      ? html`<a class="timestamp" href=${this.url} target="_blank" rel="noopener">${this.#ts}</a>`
      : html`<span class="timestamp">${this.#ts}</span>`;
  }

  render() {
    switch (this.type) {
      case 'reply':
        return html`
          ${this.#renderTimestamp()}
          <a class="sender" href=${this.authorUrl}
             target="_blank" rel="noopener">${this.authorName}:</a>
          <span class="body"><slot></slot></span>`;
      case 'like':
        return html`
          ${this.#renderTimestamp()}
          <span class="action-text">
            <a href=${this.authorUrl}
               target="_blank" rel="noopener">${this.authorName}</a> likes this
          </span>`;
      case 'repost':
        return html`
          ${this.#renderTimestamp()}
          <span class="action-text">
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
