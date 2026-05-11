import { RhSlide } from './rh-slide.js';

const closingOverrides = new CSSStyleSheet();
closingOverrides.replaceSync(`
  :host {
    color: var(--rh-color-text-primary-on-dark, #ffffff) !important;
    background-color: var(--rh-color-brand-red-on-light, #ee0000) !important;
    background-image: none !important;
    border-inline-start: 4px solid var(--rh-color-brand-red-darker, #a60000) !important;
  }
  #slide-footer {
    background: var(--rh-color-surface-lightest, #ffffff) !important;
    color: var(--rh-color-text-primary-on-light, #151515) !important;
    border: none !important;
  }
  #slide-header {
    display: none !important;
  }
  #container {
    align-items: stretch !important;
  }
  #content {
    place-content: start !important;
    align-content: start !important;
  }
`);

class RhSlideClosing extends RhSlide {
  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, closingOverrides];
  }
}
customElements.define('rh-slide-closing', RhSlideClosing);
