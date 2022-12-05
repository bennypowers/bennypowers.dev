import { RedHatSlide } from './redhat-slide.js';
import TitleTemplate from './redhat-slide-title.html.js';
import TitleStyle from './redhat-slide-title.css.js';

class RedHatSlideTitle extends RedHatSlide {
  static is = 'redhat-slide-title';
  static style = TitleStyle;
  static template = TitleTemplate;
  static target = 'content';
}

customElements.define(RedHatSlideTitle.is, RedHatSlideTitle);
