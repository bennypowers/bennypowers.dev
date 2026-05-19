import { RhSlide } from './rh-slide.js';

class RhSlideTitle extends RhSlide {
  static is = 'rh-slide-title';
  static { customElements.define(this.is, this); }
}
