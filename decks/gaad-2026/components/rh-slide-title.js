import { RhSlide } from './rh-slide.js';

const titleOverrides = new CSSStyleSheet();
titleOverrides.replaceSync(`
  :host {
    color: var(--rh-color-text-primary-on-light, #151515) !important;
    background-color: var(--rh-color-surface-lightest, #ffffff) !important;
    background-image: none !important;
  }
  #container {
    grid-template-columns: 7.18vw 29.44vw 1fr !important;
    grid-template-rows: 1fr var(--footer-height) !important;
  }
  #slide-header {
    display: none !important;
  }
  #black-bar {
    grid-column: 1 !important;
    grid-row: 1 / -1 !important;
    z-index: 1 !important;
  }
  #image-area {
    grid-column: 2 !important;
    grid-row: 1 / -1 !important;
    z-index: 1 !important;
  }
  #content {
    grid-column: 3 !important;
    grid-row: 1 !important;
    place-content: unset !important;
    height: auto !important;
  }
  #slide-footer {
    grid-column: 1 / -1 !important;
    grid-row: 2 !important;
    z-index: 2 !important;
    background: transparent !important;
  }
  #counter {
    color: #ffffff !important;
  }
`);

class RhSlideTitle extends RhSlide {
  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, titleOverrides];
  }
}
customElements.define('rh-slide-title', RhSlideTitle);
