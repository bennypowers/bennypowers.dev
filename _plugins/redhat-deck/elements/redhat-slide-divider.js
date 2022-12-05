import { RedHatSlide } from './redhat-slide.js';

import DividerTemplate from './redhat-slide-divider.html.js';
import DividerStyle from './redhat-slide-divider.css.js';

class RedHatSlideDivider extends RedHatSlide {
  static is = 'redhat-slide-divider';
  static style = DividerStyle;
  static template = DividerTemplate;
  static target = 'content';
}

customElements.define(RedHatSlideDivider.is, RedHatSlideDivider);
