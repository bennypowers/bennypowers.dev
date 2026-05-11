import { RhSlide } from './rh-slide.js';

const titleOverrides = new CSSStyleSheet();
titleOverrides.replaceSync(`
  :host {
    color: var(--rh-color-text-primary-on-dark, #ffffff) !important;
    background-color: var(--rh-color-brand-red-on-light, #ee0000) !important;
    background-image: none !important;
  }
  #container {
    grid-template-areas: "logo" "title" "presenter" "footer" !important;
    grid-template-rows: min-content 1fr auto 12vh !important;
  }
  #content {
    display: contents;
  }
  #slide-footer {
    background: var(--rh-color-surface-lightest, #ffffff);
    color: var(--rh-color-text-primary-on-light, #151515);
  }
  #slide-header {
    display: none !important;
  }
`);

class RhSlideTitle extends RhSlide {
  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, titleOverrides];
  }
}
customElements.define('rh-slide-title', RhSlideTitle);
