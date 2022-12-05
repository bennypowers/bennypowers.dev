import { SlidemSlide } from '/assets/decks.min.js';

import style from './redhat-slide.css.js';
import template from './redhat-slide.html.js';

/** @type{typeof import('slidem/slidem-slide.js').SlidemSlide} */
const Base = SlidemSlide;

export class RedHatSlide extends Base {
  static is = 'redhat-slide';

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style];
    for (const child of this.shadowRoot.children) child.remove();
    this.shadowRoot.append(template.content.cloneNode(true));
    this.shadowRoot.getElementById('page').textContent
  }
}

customElements.define(RedHatSlide.is, RedHatSlide);
