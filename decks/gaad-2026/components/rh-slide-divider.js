import { RhSlide } from './rh-slide.js';

const overrides = new CSSStyleSheet();
overrides.replaceSync(`
:host(:not([center])) #content { height: auto !important; }
`);

export class RhSlideDivider extends RhSlide {
  static is = 'rh-slide-divider';
  static { customElements.define(this.is, this); }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, overrides];
  }

  connectedCallback() {
    super.connectedCallback();
    const container = this.shadowRoot.getElementById('container');
    container.classList.toggle('has-aside', !!this.querySelector('[slot="aside"]'));
    if (this.querySelector('[variant]'))
      this.setAttribute('variant', this.querySelector('[variant]').getAttribute('variant'));
  }
}
