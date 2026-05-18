import { RhSlide } from './rh-slide.js';

const overrides = new CSSStyleSheet();
overrides.replaceSync(`
:host {
  background: var(--rh-color-surface-darker, #1f1f1f) !important;
}
:host(:not([center])) #content {
  height: auto !important;
}
`);

class RhSlideClosing extends RhSlide {
  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, overrides];
  }
}
customElements.define('rh-slide-closing', RhSlideClosing);
