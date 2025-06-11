import { Dc25Slide } from './dc25-slide.js'
class Dc25SlideImage extends Dc25Slide {
  static is = 'dc25-slide-image';
  static { customElements.define(this.is, this); }
}
