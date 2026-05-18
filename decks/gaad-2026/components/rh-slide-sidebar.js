import { RhSlide } from './rh-slide.js';

class RhSlideSidebar extends RhSlide {
  static is = 'rh-slide-sidebar';
  static { customElements.define(this.is, this); }
}
