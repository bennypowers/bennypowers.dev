import { SlidemSlide } from '/assets/decks.min.js';

export class Base extends /** @type{typeof import('slidem/slidem-slide.js').SlidemSlide} */(SlidemSlide) {
  /** @type {CSSStyleSheet} */
  static style;

  /** @type {HTMLTemplateElement} */
  static template;

  /** @type {string} */
  static target;

  /** @type{{style?:CSSStyleSheet, template?:HTMLTemplateElement, target?: string}[]} */
  static templates;

  static gatherTemplates() {
    this.templates = [];
    let link = this;
    while (link !== SlidemSlide) {
      const { template, target, style } = link;
      this.templates.push({ template, target, style })
      link = Object.getPrototypeOf(link);
    }
    this.templates.reverse();
  }

  #class = /** @type{typeof Base}*/ (this.constructor);

  /** @type {number} */
  slideNumber;

  #stampTemplates() {
    for (const { style, template, target } of this.#class.templates) {
      const { adoptedStyleSheets } = this.shadowRoot;
      if (style)
        this.shadowRoot.adoptedStyleSheets = [...adoptedStyleSheets, style];
      if (template) {
        const renderTo = target ? this.$[target] : this.shadowRoot;
        for (const child of renderTo.children)
          child.remove();
        renderTo.append(template.content.cloneNode(true));
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.#class.gatherTemplates();
    this.#stampTemplates();
    const allSlides = Array.from(this.parentElement.querySelectorAll('[name]'))
      .filter(x => x.parentElement === this.parentElement);
    this.slideNumber = (allSlides.indexOf(this) + 1);
    if (this.$.counter)
      this.$.counter.textContent = this.slideNumber.toString();
  }
}
