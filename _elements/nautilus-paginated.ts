import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('nautilus-paginated')
export class NautilusPaginated extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    #toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 2px 4px;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      border-bottom: 1px solid light-dark(#d3d7cf, #555753);
      flex-shrink: 0;
    }

    #toolbar button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--cl-button-radius, 3px);
      background: none;
      cursor: pointer;
      color: var(--cl-button-text, light-dark(#2e3436, #eeeeec));
    }

    #toolbar button:hover:not(:disabled) {
      background: var(--cl-button-bg-hover, linear-gradient(to bottom, #ffffff, #f5f4f3, #edeceb, #e4e3e2));
      border-color: var(--cl-button-border, light-dark(#9d9c9b, #555753));
    }

    #toolbar button:active:not(:disabled) {
      background: var(--cl-button-bg-active, linear-gradient(to bottom, #d4d3d2, #dbdad9, #e2e1e0, #eaeae9));
    }

    #toolbar button:disabled {
      opacity: 0.35;
      cursor: default;
    }

    #toolbar button img {
      width: 16px;
      height: 16px;
    }

    #page-info {
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size-small, 11px);
      color: var(--cl-button-text, light-dark(#2e3436, #eeeeec));
      margin-inline-start: 8px;
    }

    #viewport {
      flex: 1;
      min-height: 0;
      overflow: auto;
      scrollbar-width: auto;
      scrollbar-color: light-dark(#a3bfe1, #4a6a8a) light-dark(#d9d7d5, #3c3c3c);
    }

    #content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      align-content: start;
      gap: 4px;
      padding: 8px;
    }

    ::slotted(*) {
      color: var(--cl-text, #2e3436);
      text-align: center;
      cursor: default;
      border-radius: 3px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
      padding: 6px 4px;
      text-decoration: none;
    }

    ::slotted([hidden]) {
      display: none !important;
    }
  `;

  @property({ attribute: 'page-size', type: Number }) accessor pageSize = 9;
  @state() accessor #page = 0;

  #items: Element[] = [];

  get #totalPages(): number {
    return Math.max(1, Math.ceil(this.#items.length / this.pageSize));
  }

  firstUpdated() {
    this.#items = [...this.querySelectorAll(':scope > *')];
    this.#applyPage();
  }

  #applyPage() {
    const start = this.#page * this.pageSize;
    const end = start + this.pageSize;
    for (let i = 0; i < this.#items.length; i++) {
      this.#items[i].toggleAttribute('hidden', i < start || i >= end);
    }
    this.requestUpdate();
  }

  #goFirst() {
    this.#page = 0;
    this.#applyPage();
  }

  #goPrev() {
    if (this.#page > 0) {
      this.#page--;
      this.#applyPage();
    }
  }

  #goNext() {
    if (this.#page < this.#totalPages - 1) {
      this.#page++;
      this.#applyPage();
    }
  }

  #goLast() {
    this.#page = this.#totalPages - 1;
    this.#applyPage();
  }

  render() {
    const onFirst = this.#page === 0;
    const onLast = this.#page >= this.#totalPages - 1;
    return html`
      <div id="toolbar" role="toolbar" aria-label="Pagination">
        <button aria-label="First page"
                ?disabled="${onFirst}"
                @click="${this.#goFirst}">
          <img src="/assets/icons/gnome/actions/go-first.svg" alt="">
        </button>
        <button aria-label="Previous page"
                ?disabled="${onFirst}"
                @click="${this.#goPrev}">
          <img src="/assets/icons/gnome/actions/go-previous.svg" alt="">
        </button>
        <button aria-label="Next page"
                ?disabled="${onLast}"
                @click="${this.#goNext}">
          <img src="/assets/icons/gnome/actions/go-next.svg" alt="">
        </button>
        <button aria-label="Last page"
                ?disabled="${onLast}"
                @click="${this.#goLast}">
          <img src="/assets/icons/gnome/actions/go-last.svg" alt="">
        </button>
        ${this.#totalPages > 1 ? html`
          <span id="page-info">${this.#page + 1} of ${this.#totalPages}</span>
        ` : nothing}
      </div>
      <div id="viewport">
        <div id="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nautilus-paginated': NautilusPaginated;
  }
}
