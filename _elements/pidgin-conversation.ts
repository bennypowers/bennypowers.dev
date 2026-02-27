import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

type Protocol = 'fediverse' | 'bluesky' | 'webmention' | '';

const PROTOCOL_STORAGE_KEY = 'pidgin-protocol';
const INSTANCE_STORAGE_KEY = 'pidgin-instance';
const SOURCE_URL_STORAGE_KEY = 'pidgin-source-url';

@customElement('pidgin-conversation')
export class PidginConversation extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
    }

    .toolbar {
      display: flex;
      gap: 1px;
      padding: 2px 4px;
      border-bottom: 1px solid var(--cl-menu-separator, light-dark(#d3d7cf, #555753));

      button {
        font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
        font-size: var(--cl-font-size-small, 11px);
        padding: 2px 6px;
        border: 1px solid var(--cl-button-border, light-dark(#9d9c9b, #555753));
        border-radius: 2px;
        background: var(--cl-button-bg);
        color: var(--cl-button-text, light-dark(#2e3436, #eeeeec));
        cursor: default;
        min-width: 24px;
        min-height: 20px;
        opacity: 0.5;
      }
    }

    .protocol-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-bottom: 1px solid var(--cl-menu-separator, light-dark(#d3d7cf, #555753));
      font-size: var(--cl-font-size-small, 11px);

      label {
        color: var(--cl-text-secondary, light-dark(#555753, #babdb6));
        margin-right: 2px;
      }

      button {
        font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
        font-size: var(--cl-font-size-small, 11px);
        padding: 2px 8px;
        border: 1px solid var(--cl-button-border, light-dark(#9d9c9b, #555753));
        border-radius: 2px;
        background: var(--cl-button-bg);
        color: var(--cl-button-text, light-dark(#2e3436, #eeeeec));
        cursor: default;

        &.selected {
          background: var(--cl-button-bg-active, light-dark(#d4d3d2, #333333));
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
          border-color: var(--cl-focus-color, #729fcf);
        }
      }

      input {
        font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
        font-size: var(--cl-font-size-small, 11px);
        padding: 2px 4px;
        border: 1px solid var(--cl-button-border, light-dark(#9d9c9b, #555753));
        border-radius: 2px;
        background: light-dark(#ffffff, #1a1a1a);
        color: var(--cl-text, light-dark(#2e3436, #eeeeec));
        flex: 1;
        min-width: 160px;
      }
    }

    .conversation {
      flex: 1;
      overflow-y: auto;
      background: light-dark(#ffffff, #1a1a1a);
      padding: 8px;
      font-size: var(--cl-font-size, 13px);
      line-height: 1.4;
      min-height: 0;
    }

    ::slotted(.pidgin-date-divider) {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 4px;
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#888a85, #888a85);

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: light-dark(#d3d7cf, #555753);
      }
    }

    .input-area {
      display: flex;
      gap: 4px;
      padding: 4px;
      border-top: 1px solid var(--cl-menu-separator, light-dark(#d3d7cf, #555753));

      .input {
        flex: 1;
        min-height: 48px;
        background: light-dark(#ffffff, #1a1a1a);
        border: 1px solid var(--cl-button-border, light-dark(#9d9c9b, #555753));
        border-radius: 2px;
        padding: 4px;
        font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
        font-size: var(--cl-font-size, 13px);
        color: var(--cl-text, light-dark(#2e3436, #eeeeec));
        outline: none;
        overflow-y: auto;

        &:empty::before {
          content: attr(data-placeholder);
          color: light-dark(#888a85, #888a85);
          pointer-events: none;
        }

        &[contenteditable="false"] {
          opacity: 0.6;
        }
      }

      .send {
        align-self: flex-end;
        font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
        font-size: 12px;
        padding: 4px 16px;
        border: 1px solid var(--cl-button-border, light-dark(#9d9c9b, #555753));
        border-radius: var(--cl-button-radius, 3px);
        background: var(--cl-button-bg);
        color: var(--cl-button-text, light-dark(#2e3436, #eeeeec));
        cursor: default;

        &:disabled {
          opacity: 0.5;
        }

        &:not(:disabled):hover {
          background: var(--cl-button-bg-hover);
        }

        &:not(:disabled):active {
          background: var(--cl-button-bg-active);
        }
      }
    }

    .status-msg {
      padding: 4px 8px;
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#888a85, #888a85);
      font-style: italic;
    }
  `;

  @property({ attribute: 'post-url' }) accessor postUrl = '';

  @state() accessor protocol: Protocol = '';
  @state() accessor instance = '';
  @state() accessor sourceUrl = '';
  @state() accessor statusMessage = '';

  @query('.input') accessor inputEl!: HTMLDivElement;

  get #configured(): boolean {
    if (this.protocol === 'fediverse') return !!this.instance;
    if (this.protocol === 'webmention') return !!this.sourceUrl;
    return !!this.protocol;
  }

  get #placeholder(): string {
    if (!this.protocol) return 'Select a protocol to reply...';
    if (this.protocol === 'webmention') return 'Send a webmention from your reply URL';
    if (this.protocol === 'fediverse' && !this.instance) return 'Enter your instance URL above...';
    return 'Type a message...';
  }

  connectedCallback() {
    super.connectedCallback();
    try {
      this.protocol = (localStorage.getItem(PROTOCOL_STORAGE_KEY) as Protocol) || '';
      this.instance = localStorage.getItem(INSTANCE_STORAGE_KEY) || '';
      this.sourceUrl = localStorage.getItem(SOURCE_URL_STORAGE_KEY) || '';
    } catch {}
    // Sort messages chronologically and insert date dividers
    requestAnimationFrame(() => this.#organizeMessages());
  }

  #organizeMessages() {
    const messages = [...this.querySelectorAll('pidgin-message[timestamp]')];
    if (!messages.length) return;

    // Sort ascending by timestamp (oldest first, latest last)
    messages.sort((a, b) => {
      const ta = new Date(a.getAttribute('timestamp') || 0).getTime();
      const tb = new Date(b.getAttribute('timestamp') || 0).getTime();
      return ta - tb;
    });

    // Re-append in sorted order and insert date dividers
    let lastDate = '';
    for (const msg of messages) {
      const ts = msg.getAttribute('timestamp') || '';
      if (!ts) continue;
      const d = new Date(ts);
      const dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        timeZone: 'UTC',
      });
      if (dateStr !== lastDate) {
        const divider = document.createElement('div');
        divider.className = 'pidgin-date-divider';
        divider.textContent = dateStr;
        this.appendChild(divider);
        lastDate = dateStr;
      }
      this.appendChild(msg);
    }

    // Scroll conversation to bottom
    this.updateComplete?.then(() => {
      const conv = this.shadowRoot?.querySelector('.conversation');
      if (conv) conv.scrollTop = conv.scrollHeight;
    });
  }

  render() {
    return html`
      <div class="toolbar">
        <button disabled aria-label="Font">A</button>
        <button disabled aria-label="Bold"><b>B</b></button>
        <button disabled aria-label="Italic"><i>I</i></button>
        <button disabled aria-label="Underline"><u>U</u></button>
      </div>

      <div class="conversation" role="log" aria-label="Conversation">
        <slot></slot>
        ${this.statusMessage ? html`<div class="status-msg">${this.statusMessage}</div>` : ''}
      </div>

      <div class="protocol-bar">
        <label>Reply via:</label>
        <button class=${classMap({ selected: this.protocol === 'fediverse' })}
                @click=${() => this.#selectProtocol('fediverse')}>Fediverse</button>
        <button class=${classMap({ selected: this.protocol === 'bluesky' })}
                @click=${() => this.#selectProtocol('bluesky')}>Bluesky</button>
        <button class=${classMap({ selected: this.protocol === 'webmention' })}
                @click=${() => this.#selectProtocol('webmention')}>Webmention</button>
        ${this.protocol === 'fediverse' ? html`
          <input type="text"
                 placeholder="your.instance"
                 .value=${this.instance}
                 @change=${this.#onInstanceChange}
                 @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.#onInstanceChange(e); }}>
        ` : ''}
        ${this.protocol === 'webmention' ? html`
          <input type="url"
                 placeholder="https://you.example.com/reply-post"
                 .value=${this.sourceUrl}
                 @change=${this.#onSourceUrlChange}
                 @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.#onSourceUrlChange(e); }}>
        ` : ''}
      </div>

      ${this.protocol === 'webmention' ? html`
      <form class="input-area" @submit=${this.#onWebmentionSubmit}
            action=${this.#webmentionEndpoint ?? ''}
            method="POST">
        <input type="hidden" name="source" .value=${this.sourceUrl}>
        <input type="hidden" name="target" .value=${this.postUrl}>
        <div class="input"
             contenteditable="false"
             data-placeholder=${this.#placeholder}></div>
        <button class="send"
                type="submit"
                ?disabled=${!this.#configured}>Send</button>
      </form>
      ` : html`
      <div class="input-area">
        <div class="input"
             contenteditable=${this.#configured ? 'true' : 'false'}
             data-placeholder=${this.#placeholder}
             @keydown=${this.#onInputKeydown}></div>
        <button class="send"
                ?disabled=${!this.#configured}
                @click=${this.#onSend}>Send</button>
      </div>
      `}
    `;
  }

  #selectProtocol(p: Protocol) {
    this.protocol = this.protocol === p ? '' : p;
    try { localStorage.setItem(PROTOCOL_STORAGE_KEY, this.protocol); } catch {}
  }

  get #webmentionEndpoint(): string | null {
    return document.querySelector('link[rel=webmention]')?.getAttribute('href') ?? null;
  }

  #onSourceUrlChange(e: Event) {
    this.sourceUrl = (e.target as HTMLInputElement).value.trim();
    try { localStorage.setItem(SOURCE_URL_STORAGE_KEY, this.sourceUrl); } catch {}
    this.requestUpdate();
  }

  #onInstanceChange(e: Event) {
    this.instance = (e.target as HTMLInputElement).value.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    try { localStorage.setItem(INSTANCE_STORAGE_KEY, this.instance); } catch {}
    this.requestUpdate();
  }

  #onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.#onSend();
    }
  }

  #onSend() {
    if (!this.#configured) return;
    const text = this.inputEl?.textContent?.trim() || '';
    if (!text) return;

    switch (this.protocol) {
      case 'fediverse': {
        const body = this.postUrl ? `${text}\n\n${this.postUrl}` : text;
        window.open(`https://${this.instance}/share?text=${encodeURIComponent(body)}`, '_blank');
        this.inputEl.textContent = '';
        break;
      }
      case 'bluesky': {
        const body = this.postUrl ? `${text}\n\n${this.postUrl}` : text;
        window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(body)}`, '_blank');
        this.inputEl.textContent = '';
        break;
      }
    }
  }

  #onWebmentionSubmit(e: SubmitEvent) {
    e.preventDefault();
    const endpoint = this.#webmentionEndpoint;
    if (!endpoint) {
      this.statusMessage = 'No webmention endpoint found on this page.';
      return;
    }
    if (!this.sourceUrl) return;

    // Optimistically append the reply to the conversation
    const msg = document.createElement('pidgin-message');
    msg.setAttribute('type', 'reply');
    msg.setAttribute('timestamp', new Date().toISOString());
    msg.setAttribute('url', this.sourceUrl);
    msg.setAttribute('author-name', 'You');
    msg.setAttribute('author-url', this.sourceUrl);
    msg.innerHTML = `<a href="${this.sourceUrl}">${this.sourceUrl}</a>`;
    this.appendChild(msg);

    // Scroll to bottom
    this.updateComplete?.then(() => {
      const conv = this.shadowRoot?.querySelector('.conversation');
      if (conv) conv.scrollTop = conv.scrollHeight;
    });

    this.statusMessage = 'Sending webmention...';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `source=${encodeURIComponent(this.sourceUrl)}&target=${encodeURIComponent(this.postUrl)}`,
    }).then(res => {
      this.statusMessage = res.ok
        ? `Webmention sent! (${res.status})`
        : `Error: ${res.status} ${res.statusText}`;
      if (!res.ok) msg.remove();
    }).catch(err => {
      this.statusMessage = `Failed: ${err.message}`;
      msg.remove();
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pidgin-conversation': PidginConversation;
  }
}
