import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './ooo-impress.css';

type View = 'normal' | 'sorter';

const TABS = ['Normal', 'Outline', 'Notes', 'Handout', 'Slide Sorter'] as const;

/**
 * OpenOffice.org 2.x Impress presentation viewer. Provides view tabs
 * with ARIA roles for switching between normal and slide sorter views.
 * Use for displaying slide decks.
 *
 * @summary OpenOffice Impress-style presentation viewer
 */
@customElement('ooo-impress')
export class OooImpress extends LitElement {
  static styles = styles;

  /** Active view mode: 'normal' for single slide, 'sorter' for grid overview */
  @property({ reflect: true }) accessor view: View = 'normal';

  render() {
    const activeTab = this.view === 'sorter' ? 'Slide Sorter' : 'Normal';
    const activeId = `tab-${this.view}`;
    return html`
      <div id="view-tabs" role="tablist" aria-label="View">
        ${TABS.map(tab => {
          const id = `tab-${tab === 'Slide Sorter' ? 'sorter' : tab.toLowerCase()}`;
          return html`
          <div class="tab"
               id="${id}"
               role="tab"
               aria-selected="${tab === activeTab}"
               tabindex="${tab === activeTab ? 0 : -1}">${tab}</div>
        `;})}
      </div>
      <div id="workspace" role="tabpanel" aria-labelledby="${activeId}">
        <!-- Slide content, typically ooo-impress-deck elements. Each deck SHOULD have a meaningful label for accessibility. -->
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ooo-impress': OooImpress;
  }
}
