import { SlidemSlide } from '/assets/decks.min.js';

export class RhSlide extends SlidemSlide {
  static is = 'rh-slide';
  static { customElements.define(this.is, this); }

  #$(selector) { return this.shadowRoot.getElementById(selector); }

  connectedCallback() {
    super.connectedCallback();
    const container = this.#$('container');
    const splitScreen = this.#$('split-screen');
    const hasSlots = !!(this.querySelector('[slot=left]') || this.querySelector('[slot=right]'))
    container.classList.toggle('has-image-left', !!this.querySelector('[slot="image-left"]'));
    container.classList.toggle('has-image-right', !!this.querySelector('[slot="image-right"]'));
    container.classList.toggle('full-width', !!this.querySelector('.full-width'));
    container.classList.toggle('chevrons', !!this.querySelector('[slot^="chevron"]'));
    splitScreen?.toggleAttribute('hidden', !hasSlots);
    this.#updateCounterAndNotes();
  }

  #updateCounterAndNotes() {
    const deck = this.closest('slidem-deck');
    if (deck?.currentSlide === this) {
      const stepMatch = location.hash.match(/step-(\d+)/);
      if (stepMatch) this.step = Number(stepMatch[1]);
    }
    const allSlides = Array.from(deck.querySelectorAll('*')).filter(x => x instanceof SlidemSlide);
    const counter = this.shadowRoot.getElementById('counter');
    if (counter)
      counter.textContent = (allSlides.indexOf(this) + 1).toString();
    const notes = this.shadowRoot.querySelectorAll('[slot=notes]');
    for (const note of notes) {
      note.setAttribute('slide', allSlides.indexOf(this) + 1);
      deck.append(note);
    }
  }
}
