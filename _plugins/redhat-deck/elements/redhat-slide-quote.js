import { RedHatSlide } from './redhat-slide.js';

// import partial from './redhat-slide-title.html.js';
// import style from './redhat-slide-title.css.js';

class RedHatSlideQuote extends RedHatSlide {
  static is = 'redhat-slide-quote';

  constructor() {
    super();
    // this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style];
    // const content = this.shadowRoot.getElementById('content')
    // for (const child of content.children) child.remove();
    // content.append(partial.content.cloneNode(true));
  }
}

customElements.define(RedHatSlideQuote.is, RedHatSlideQuote);
