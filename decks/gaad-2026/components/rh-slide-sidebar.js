import { RhSlide } from './rh-slide.js';

const overrides = new CSSStyleSheet();
overrides.replaceSync(`
:host(:not([center])) #content { height: auto !important; }
`);

class RhSlideSidebar extends RhSlide {
  static is = 'rh-slide-sidebar';
  static { customElements.define(this.is, this); }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, overrides];
  }
}
