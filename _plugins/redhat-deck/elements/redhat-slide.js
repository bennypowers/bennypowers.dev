import { Base } from './Base.js';

import SlideStyle from './redhat-slide.css.js';
import SlideTemplate from './redhat-slide.html.js';

export class RedHatSlide extends Base {
  static is = 'redhat-slide';
  static style = SlideStyle;
  static template = SlideTemplate;
}

customElements.define(RedHatSlide.is, RedHatSlide);
