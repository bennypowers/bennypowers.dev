import { RhSlide } from './rh-slide.js';

const dividerOverrides = new CSSStyleSheet();
dividerOverrides.replaceSync(`
  :host {
    background-color: var(--rh-color-surface-lightest, #ffffff) !important;
    background-image: none !important;
    color: var(--rh-color-text-primary-on-light, #151515) !important;
  }
  :host([has-aside]) #container {
    grid-template-columns: 3fr 2fr !important;
    grid-template-rows: var(--header-height) 1fr var(--footer-height) !important;
  }
  :host([has-aside]) #slide-header {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }
  :host([has-aside]) #content {
    grid-column: 1 !important;
    grid-row: 2 !important;
  }
  :host([has-aside]) #aside {
    display: flex !important;
    grid-column: 2 !important;
    grid-row: 1 / -1 !important;
    z-index: 1 !important;
    flex-direction: column;
    justify-content: center;
    font-size: 1.4vw;
    color: var(--rh-color-text-primary-on-light, #151515);
    padding: 3vw;
    background: var(--rh-color-surface-lighter, #f2f2f2);
  }
  :host([variant="grey"]) {
    background-color: var(--rh-color-surface-lighter, #f2f2f2) !important;
  }
  :host([variant="grey"][has-aside]) #aside {
    background: var(--rh-color-surface-lightest, #ffffff) !important;
  }
  :host([has-aside]) #slide-footer {
    grid-column: 1 / -1 !important;
    grid-row: 3 !important;
    z-index: 2 !important;
    background: transparent !important;
  }
`);

class RhSlideDivider extends RhSlide {
  static is = 'rh-slide-divider';
  static { customElements.define(this.is, this); }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, dividerOverrides];
  }

  static observedAttributes = [...(super.observedAttributes ?? []), 'variant'];

  connectedCallback() {
    super.connectedCallback();
    if (this.querySelector('[slot="aside"]'))
      this.setAttribute('has-aside', '');
    if (this.querySelector('[variant]'))
      this.setAttribute('variant', this.querySelector('[variant]').getAttribute('variant'));
  }
}
