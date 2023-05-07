import { SlidemSlide } from 'slidem/slidem-slide.js';

export class Base extends SlidemSlide {
  /** @type {number} */
  slideNumber;

  /** @type {HTMLTemplateElement} */
  static template;

  constructor() {
    super();
    const { template } = /**@type{typeof Base}*/(this.constructor);
    if (template) {
      for (const el of this.shadowRoot.children) el.remove()
      this.shadowRoot.append(template.content.cloneNode(true));
    }
  }

  async connectedCallback() {
    await super.connectedCallback?.();
    const allSlides = Array.from(this.parentElement.querySelectorAll('[name]'))
      .filter(x => x.parentElement === this.parentElement);
    this.slideNumber = (allSlides.indexOf(this) + 1);
    if (this.$.counter)
      this.$.counter.textContent = this.slideNumber.toString();
  }
}
