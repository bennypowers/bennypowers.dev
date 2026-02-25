import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type View = 'normal' | 'sorter';

const TABS = ['Normal', 'Outline', 'Notes', 'Handout', 'Slide Sorter'] as const;

@customElement('ooo-impress')
export class OooImpress extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
    }

    #view-tabs {
      display: flex;
      gap: 0;
      padding: 4px 6px 0;
      flex-shrink: 0;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
    }

    .tab {
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: 11px;
      padding: 3px 8px;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-bottom: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 3px 3px 0 0;
      background: linear-gradient(to bottom, light-dark(#e6e5e4, #3c3c3c), light-dark(#dadddb, #363636));
      color: light-dark(#2e3436, #eeeeec);
      cursor: default;
      position: relative;
      top: 1px;
    }

    .tab[aria-selected="true"] {
      background:
        linear-gradient(to bottom,
          light-dark(#acd0f6, #4a7aaa) 0px,
          light-dark(#9ab6da, #3e6a9a) 2px,
          var(--cl-window-bg, light-dark(#edeceb, #2e3436)) 2px);
      border-color: light-dark(#5f87b2, #3a5a7a);
      border-bottom-color: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      z-index: 1;
    }

    #workspace {
      flex: 1;
      min-height: 0;
      background: #808080;
      overflow: auto;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-top: none;
      margin: 0 6px 6px;
    }

    :host([view="sorter"]) #workspace {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 24px;
      padding: 24px;
    }
  `;

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
