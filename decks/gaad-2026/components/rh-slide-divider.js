import { RhSlide } from './rh-slide.js';

const dividerOverrides = new CSSStyleSheet();
dividerOverrides.replaceSync(`
  :host {
    background-color: var(--rh-color-surface-lightest, #ffffff) !important;
    background-image: none !important;
    color: var(--rh-color-text-primary-on-light, #151515) !important;
  }
  :host([has-aside]) #content {
    grid-template-columns: 3fr 2fr !important;
    grid-template-areas: "title aside" !important;
  }
  :host([has-aside]) #aside {
    display: block !important;
    font-size: 1.4vw;
    color: var(--rh-color-text-primary-on-light, #151515);
    padding: 3vw;
    padding-block-start: 5vw;
    background: var(--rh-color-surface-lighter, #f2f2f2);
    align-self: stretch;
    margin-block-start: -2vw;
    margin-block-end: -100vh;
    padding-block-end: 100vh;
    margin-inline-end: -5vw;
  }
`);

class RhSlideDivider extends RhSlide {
  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, dividerOverrides];
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.querySelector('[slot="aside"]'))
      this.setAttribute('has-aside', '');
  }
}
customElements.define('rh-slide-divider', RhSlideDivider);
