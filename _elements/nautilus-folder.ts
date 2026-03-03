import { LitElement, html, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './nautilus-folder.css';

@customElement('nautilus-folder')
export class NautilusFolder extends LitElement {
  static styles = styles;

  @property({ attribute: 'sort-by', reflect: true }) accessor sortBy: string = 'name';
  @property({ attribute: 'sort-order', reflect: true }) accessor sortOrder: string = 'ascending';

  #items: HTMLElement[] = [];

  override connectedCallback() {
    super.connectedCallback();
    if (!isServer)
      document.addEventListener('click', this.#onDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#onDocumentClick);
  }

  override firstUpdated() {
    this.#items = [...this.children] as HTMLElement[];
  }

  override updated(changed: Map<string, unknown>) {
    if (this.#items.length && (changed.has('sortBy') || changed.has('sortOrder')))
      this.#sort();
  }

  #sort() {
    const key = this.sortBy === 'count' ? 'sortCount' : 'sortName';
    const ascending = this.sortOrder === 'ascending';
    const numeric = this.sortBy === 'count';

    this.#items.sort((a, b) => {
      const aVal = a.dataset[key] ?? '';
      const bVal = b.dataset[key] ?? '';
      const result = numeric
        ? (Number(aVal) || 0) - (Number(bVal) || 0)
        : aVal.localeCompare(bVal);
      return ascending ? result : -result;
    });

    for (const item of this.#items)
      this.appendChild(item);
  }

  #onDocumentClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.localName !== 'gtk2-menu-item') return;

    const sortField = target.dataset.sortField;
    const sortOrder = target.dataset.sortOrder;

    if (sortField) {
      this.sortBy = sortField;
      for (const sibling of target.parentElement?.querySelectorAll('gtk2-menu-item[data-sort-field]') ?? [])
        (sibling as any).checked = sibling === target;
    }

    if (sortOrder) {
      this.sortOrder = sortOrder;
      for (const sibling of target.parentElement?.querySelectorAll('gtk2-menu-item[data-sort-order]') ?? [])
        (sibling as any).checked = sibling === target;
    }

    if (sortField || sortOrder) {
      const menuButton = target.closest('gtk2-menu-button') as any;
      if (menuButton?.hide) menuButton.hide();
    }
  };

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nautilus-folder': NautilusFolder;
  }
}
