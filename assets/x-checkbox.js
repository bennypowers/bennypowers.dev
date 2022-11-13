class XCheckbox extends HTMLElement {
  static formAssociated = true;

  static observedAttributes = ['checked'];

  #internals = this.attachInternals();

  get checked() { return this.hasAttribute('checked'); }
  set checked(x) { this.toggleAttribute('checked', x); }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.textContent = this.checked ? '✅' : '❌';
    this.addEventListener('click', this.#onClick);
  }

  /**
   * @param {string} name
   * @param {string} old
   * @param {string} value
   */
  attributeChangedCallback(name, old, value) {
    const checked = value != null;
    this.#internals.setFormValue(String(checked));
    this.shadowRoot.textContent = checked ? '✅' : '❌';
    this.checked = checked;
  }

  /**
   * @param {Event} event
   */
  #onClick(event) {
    console.log(event);
    const labels = Array.from(this.#internals.labels);
    const path = /** @type {Node[]} */(event.composedPath());
    if (path.every(x => !labels.includes(x)))
      this.checked = !this.checked;
  }
}

customElements.define('x-checkbox', XCheckbox);

