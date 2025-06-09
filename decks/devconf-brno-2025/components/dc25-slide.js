import { SlidemSlide } from '/assets/decks.min.js';

export class Dc25Slide extends SlidemSlide {
  static is = "dc25-slide";
  static { customElements.define(this.is, this); }

  connectedCallback() {
    super.connectedCallback();
    if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot') || !HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode'))
      this.addEventListener('declarative-shadow-dom-stamped', this.afterStamp, { once: true });
    else
      this.afterStamp();
  }

  afterStamp() {
    this.defineSteps(this.shadowRoot.querySelectorAll('[reveal]') ?? [])
    const deck = this.closest('slidem-deck');
    const allSlides = Array.from(deck.querySelectorAll('*')).filter(x => x instanceof SlidemSlide);
    const notes = this.shadowRoot.querySelectorAll('[slot=notes]');
    for (const note of notes) {
      note.setAttribute('slide', allSlides.indexOf(this) + 1);
      deck.append(note);
    }
  }
}

