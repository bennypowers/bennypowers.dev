import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import styles from './nautilus-paginated.css';

@customElement('nautilus-paginated')
export class NautilusPaginated extends LitElement {
  static styles = styles;

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
