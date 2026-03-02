import { LitElement, html, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './gtk2-notebook.css';

@customElement('gtk2-notebook')
export class Gtk2Notebook extends LitElement {
  static styles = styles;

  #tabs: Element[] = [];
  #panels: Element[] = [];

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.addEventListener('click', this.#onTabClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
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
