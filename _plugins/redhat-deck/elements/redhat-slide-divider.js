import { RedHatSlide } from './redhat-slide.js';

import partial from './redhat-slide-divider.html.js';
import style from './redhat-slide-divider.css.js';

class RedHatSlideDivider extends RedHatSlide {
  static is = 'redhat-slide-divider';

  $ = x => this.shadowRoot.querySelector(x);

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style];
    const content = this.$('#content')
    for (const child of content.children) child.remove();
    content.append(partial.content.cloneNode(true));
  }
}

customElements.define(RedHatSlideDivider.is, RedHatSlideDivider);
