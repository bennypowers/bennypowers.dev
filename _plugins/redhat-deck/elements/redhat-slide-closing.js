import { RedHatSlide } from './redhat-slide.js';

import ClosingTemplate from './redhat-slide-closing.html.js';
import ClosingStyle from './redhat-slide-closing.css.js';

class RedHatSlideClosing extends RedHatSlide {
  static is = 'redhat-slide-closing';
  static style = ClosingStyle;
  static template = ClosingTemplate;
}

customElements.define(RedHatSlideClosing.is, RedHatSlideClosing);
