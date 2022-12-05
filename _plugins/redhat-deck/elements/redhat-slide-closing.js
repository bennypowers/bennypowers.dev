import { RedHatSlide } from './redhat-slide.js';

// import partial from './redhat-slide-divider.html.js';
import style from './redhat-slide-closing.css.js';

class RedHatSlideClosing extends RedHatSlide {
  static is = 'redhat-slide-closing';

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style];
    // const content = this.shadowRoot.getElementById('content')
    // for (const child of content.children) child.remove();
    // content.append(partial.content.cloneNode(true));
  }
}

customElements.define(RedHatSlideClosing.is, RedHatSlideClosing);
