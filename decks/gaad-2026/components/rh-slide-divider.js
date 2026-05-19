import { RhSlide } from './rh-slide.js';

export class RhSlideDivider extends RhSlide {
  static is = 'rh-slide-divider';
  static { customElements.define(this.is, this); }

  connectedCallback() {
    super.connectedCallback();
    if (this.querySelector('[variant]'))
      this.setAttribute('variant', this.querySelector('[variant]').getAttribute('variant'));
    const container = this.shadowRoot.getElementById('container');
    if (!container) return;
    container.classList.toggle('has-aside', !!this.querySelector('[slot="aside"]'));
  }
}
