import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import styles from './nautilus-folder.css';

const ZOOM_LEVELS = [32, 48, 64] as const;

@customElement('nautilus-folder')
export class NautilusFolder extends LitElement {
  static styles = styles;

  @property({ reflect: true }) accessor view: 'icons' | 'list' = 'icons';
  @property({ type: Number, reflect: true }) accessor zoom: number = 48;
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

  #sortByColumn(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ascending';
    }
  }

  #onDocumentClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.localName !== 'gtk2-menu-item') return;

    const sortField = target.dataset.sortField;
    const sortOrder = target.dataset.sortOrder;
    const viewField = target.dataset.view;
    const zoomAction = target.dataset.zoom;

    // View switching
    if (viewField === 'icons' || viewField === 'list') {
      this.view = viewField;
      for (const sib of target.parentElement?.querySelectorAll('gtk2-menu-item[data-view]') ?? [])
        (sib as any).checked = sib === target;
    }

    // Zoom
    if (zoomAction) {
      const idx = ZOOM_LEVELS.indexOf(this.zoom as typeof ZOOM_LEVELS[number]);
      if (zoomAction === 'in' && idx < ZOOM_LEVELS.length - 1)
        this.zoom = ZOOM_LEVELS[idx + 1];
      else if (zoomAction === 'out' && idx > 0)
        this.zoom = ZOOM_LEVELS[idx - 1];
      else if (zoomAction === 'normal')
        this.zoom = 48;
      this.#syncZoomDisabled(target);
    }

    // Sort field
    if (sortField) {
      this.sortBy = sortField;
      for (const sib of target.parentElement?.querySelectorAll('gtk2-menu-item[data-sort-field]') ?? [])
        (sib as any).checked = sib === target;
    }

    // Sort order
    if (sortOrder) {
      this.sortOrder = sortOrder;
      for (const sib of target.parentElement?.querySelectorAll('gtk2-menu-item[data-sort-order]') ?? [])
        (sib as any).checked = sib === target;
    }

    if (sortField || sortOrder || viewField || zoomAction) {
      const menuButton = target.closest('gtk2-menu-button') as any;
      if (menuButton?.hide) menuButton.hide();
    }
  };

  #syncZoomDisabled(menuItem: HTMLElement) {
    const menu = menuItem.parentElement;
    if (!menu) return;
    const idx = ZOOM_LEVELS.indexOf(this.zoom as typeof ZOOM_LEVELS[number]);
    const zoomIn = menu.querySelector('[data-zoom="in"]') as HTMLElement | null;
    const zoomOut = menu.querySelector('[data-zoom="out"]') as HTMLElement | null;
    if (zoomIn) zoomIn.toggleAttribute('disabled', idx >= ZOOM_LEVELS.length - 1);
    if (zoomOut) zoomOut.toggleAttribute('disabled', idx <= 0);
  }

  render() {
    const sortAsc = this.sortOrder === 'ascending';
    return html`
      ${this.view === 'list' ? html`
        <div id="list-header">
          <span id="col-icon"></span>
          <button class=${classMap({ sorted: this.sortBy === 'name', asc: sortAsc, desc: !sortAsc })}
                  @click=${() => this.#sortByColumn('name')}>Name</button>
          <button class=${classMap({ sorted: this.sortBy === 'count', asc: sortAsc, desc: !sortAsc })}
                  @click=${() => this.#sortByColumn('count')}>Items</button>
        </div>
      ` : nothing}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nautilus-folder': NautilusFolder;
  }
}
