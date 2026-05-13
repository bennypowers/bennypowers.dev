import { SlidemSlide } from '/assets/decks.min.js';

const overrides = new CSSStyleSheet();
overrides.replaceSync(`
  :host {
    font-size: 2vw;
    background: var(--rh-color-surface-lightest, white);
    color: var(--rh-color-text-primary-on-light, #151515);
  }
  :host(:not([center])) #content {
    height: auto;
  }
  #container {
    display: grid;
    grid-template-areas: "header" "body" "footer";
    grid-template-rows: 4vw 1fr 5vw;
    height: 100%;
    width: 100%;
    align-items: stretch;
  }
  #content {
    grid-area: body;
    padding-inline: 5vw;
    overflow: hidden;
    scale: none;
    display: grid;
    place-content: center;
  }
  :host([variant="image-body"]) #content {
    grid-template-columns: 22.06vw 1fr;
    gap: 4.85vw;
    place-content: center stretch;
    padding-inline-start: 0;
  }
  #slide-footer {
    background: var(--rh-color-surface-lightest, #ffffff);
    color: var(--rh-color-text-primary-on-light, #151515);
  }
`);

export class RhSlide extends SlidemSlide {
  static is = 'rh-slide';
  static { customElements.define(this.is, this); }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, overrides];
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.querySelector('.image-body'))
      this.setAttribute('variant', 'image-body');
    if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot') || !HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode'))
      this.addEventListener('declarative-shadow-dom-stamped', this.afterStamp, { once: true });
    else
      this.afterStamp();
  }

  afterStamp() {
    const shadowReveals = this.shadowRoot.querySelectorAll('[reveal]');
    const lightReveals = this.querySelectorAll('[reveal]');
    this.defineSteps([...shadowReveals, ...lightReveals]);
    const deck = this.closest('slidem-deck');
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
