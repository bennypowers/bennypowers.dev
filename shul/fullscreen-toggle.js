export class FullscreenToggleElement extends HTMLElement {
  static is = 'fullscreen-toggle';

  static template = document.createElement('template');

  static styles = new CSSStyleSheet();

  static {
    this.styles.replaceSync(/* css */`
      button {
        height: 100%;
        width: 100%;
        background: none;
        border: none;
      }
    `);
    this.template.innerHTML = `
      <button id="fullscreen" hidden>
        <svg xmlns="http://www.w3.org/2000/svg"
             fill="none"
             stroke="currentcolor"
             stroke-linecap="round"
             stroke-linejoin="round"
             stroke-width="2"
             viewBox="0 0 32 32">
          <path d="M4 12V4h8m8 0h8v8M4 20v8h8m16-8v8h-8"/>
        </svg>
      </button>
      <button id="exit-fullscreen" hidden>
        <svg xmlns="http://www.w3.org/2000/svg"
             fill="none"
             stroke="currentcolor"
             stroke-linecap="round"
             stroke-linejoin="round"
             stroke-width="2"
             viewBox="0 0 32 32">
          <path d="M4 12h8V4m8 0v8h8M4 20h8v8m16-8h-8v8"/>
        </svg>
      </button>
    `;
    customElements.define(this.is, this);
  }

  static observedAttributes = ['for'];

  for = null;

  get #exitButton() { return this.shadowRoot.getElementById('exit-fullscreen'); }

  get #fullscreenButton() { return this.shadowRoot.getElementById('fullscreen'); }

  attributeChangedCallback(name, _, newv) {
    switch (name) {
      case 'for':
        this.for = newv ?? null;
        this.connectedCallback();
    }
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(FullscreenToggleElement.template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [FullscreenToggleElement.styles];
    this.addEventListener('click', this.#onClick);
  }

  connectedCallback() {
    addEventListener('fullscreenchange', this.#onFullscreenchange)
    this.#onFullscreenchange();
  }

  disconnectedCallback() {
    globalThis.removeEventListener('fullscreenchange', this.#onFullscreenchange)
  }

  #onFullscreenchange = () => {
    this.#exitButton.hidden = !document.fullscreenElement;
    this.#fullscreenButton.hidden = !!document.fullscreenElement;
  }

  async #onClick() {
    const root = /** @type {Document|ShadowRoot} */ (this.getRootNode());
    const fse = this.for ? root.getElementById(this.for) ?? document.body : document.body;
    if (document.fullscreenElement)
      await document.exitFullscreen();
    else
      await fse.requestFullscreen();
  }
}
