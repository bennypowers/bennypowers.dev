import { RhSlide } from './rh-slide.js';

const sidebarOverrides = new CSSStyleSheet();
sidebarOverrides.replaceSync(`
  #container {
    grid-template-columns: 3fr 2fr !important;
    grid-template-rows: var(--header-height) 1fr var(--footer-height) !important;
  }
  #slide-header {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }
  #content {
    grid-column: 1 !important;
    grid-row: 2 !important;
  }
  #sidebar {
    grid-column: 2 !important;
    grid-row: 1 / -1 !important;
    z-index: 1 !important;
  }
  #slide-footer {
    grid-column: 1 / -1 !important;
    grid-row: 3 !important;
    z-index: 2 !important;
    background: transparent !important;
  }
`);

class RhSlideSidebar extends RhSlide {
  static is = 'rh-slide-sidebar';
  static { customElements.define(this.is, this); }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sidebarOverrides];
  }
}
