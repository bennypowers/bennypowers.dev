import { RhSlide } from './rh-slide.js';

export class RhSlideDivider extends RhSlide {
  static is = 'rh-slide-divider';
  static { customElements.define(this.is, this); }

  connectedCallback() {
    super.connectedCallback();
    const container = this.shadowRoot.getElementById('container');
    container.classList.toggle('has-aside', !!this.querySelector('[slot="aside"]'));
    if (this.querySelector('[variant]'))
      this.setAttribute('variant', this.querySelector('[variant]').getAttribute('variant'));
  }
}
