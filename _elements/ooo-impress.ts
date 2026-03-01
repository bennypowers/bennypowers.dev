import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './ooo-impress.css';

type View = 'normal' | 'sorter';

const TABS = ['Normal', 'Outline', 'Notes', 'Handout', 'Slide Sorter'] as const;

@customElement('ooo-impress')
export class OooImpress extends LitElement {
  static styles = styles;

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
