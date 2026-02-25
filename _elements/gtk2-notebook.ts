import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('gtk2-notebook')
export class Gtk2Notebook extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    #tab-bar {
      display: flex;
      gap: 0;
      padding: 4px 6px 0;
      flex-shrink: 0;
    }

    ::slotted([slot^="tab"]) {
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: 12px;
      padding: 3px 10px;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-bottom: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 3px 3px 0 0;
      background: linear-gradient(to bottom, light-dark(#e6e5e4, #3c3c3c), light-dark(#dadddb, #363636));
      color: light-dark(#2e3436, #eeeeec);
      cursor: default;
      position: relative;
      top: 1px;
    }

    ::slotted([slot^="tab"][aria-selected="true"]) {
      background:
        linear-gradient(to bottom,
          light-dark(#acd0f6, #4a7aaa) 0px,
          light-dark(#9ab6da, #3e6a9a) 2px,
          var(--cl-window-bg, light-dark(#edeceb, #2e3436)) 2px);
      border-color: light-dark(#5f87b2, #3a5a7a);
      border-bottom-color: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      z-index: 1;
    }

    #content {
      flex: 1;
      min-height: 0;
      margin: 0 6px;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 0 3px 3px 3px;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      padding: 12px;
      overflow: auto;
    }

    ::slotted([slot^="panel"]) {
      display: none;
    }

    ::slotted([slot^="panel"][aria-hidden="false"]) {
      display: block;
    }
  `;

  #tabs: Element[] = [];
  #panels: Element[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#onTabClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onTabClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  firstUpdated() {
    this.#tabs = [...this.querySelectorAll('[slot^="tab"]')];
    this.#panels = [...this.querySelectorAll('[slot^="panel"]')];

    // Set up ARIA
    for (let i = 0; i < this.#tabs.length; i++) {
      const tab = this.#tabs[i];
      const panel = this.#panels[i];
      const id = `gtk2-notebook-${this.#id}-${i}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('id', `${id}-tab`);
      tab.setAttribute('aria-controls', `${id}-panel`);
      tab.setAttribute('tabindex', '-1');
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('id', `${id}-panel`);
        panel.setAttribute('aria-labelledby', `${id}-tab`);
      }
    }

    const activeIndex = this.#tabs.findIndex(t => t.classList.contains('active'));
    this.#activate(activeIndex >= 0 ? activeIndex : 0);
  }

  #id = Math.random().toString(36).slice(2, 8);

  #onTabClick = (e: Event) => {
    const tab = (e.target as Element)?.closest?.('[slot^="tab"]');
    if (!tab) return;
    const index = this.#tabs.indexOf(tab);
    if (index >= 0) this.#activate(index);
  };

  #onKeyDown = (e: KeyboardEvent) => {
    const tab = (e.target as Element)?.closest?.('[slot^="tab"]');
    if (!tab) return;
    const index = this.#tabs.indexOf(tab);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (index + 1) % this.#tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (index - 1 + this.#tabs.length) % this.#tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = this.#tabs.length - 1;
    }
    if (next >= 0) {
      e.preventDefault();
      this.#activate(next);
      (this.#tabs[next] as HTMLElement).focus();
    }
  };

  #activate(index: number) {
    for (let i = 0; i < this.#tabs.length; i++) {
      const selected = i === index;
      this.#tabs[i].setAttribute('aria-selected', String(selected));
      this.#tabs[i].setAttribute('tabindex', selected ? '0' : '-1');
      this.#tabs[i].classList.toggle('active', selected);
      this.#panels[i]?.setAttribute('aria-hidden', String(!selected));
      this.#panels[i]?.classList.toggle('active', selected);
    }
  }

  render() {
    return html`
      <div id="tab-bar" role="tablist">
        <slot name="tab-0"></slot>
        <slot name="tab-1"></slot>
        <slot name="tab-2"></slot>
        <slot name="tab-3"></slot>
      </div>
      <div id="content">
        <slot name="panel-0"></slot>
        <slot name="panel-1"></slot>
        <slot name="panel-2"></slot>
        <slot name="panel-3"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk2-notebook': Gtk2Notebook;
  }
}
