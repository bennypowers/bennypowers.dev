class XCheckbox extends HTMLElement {
  static formAssociated = true;

  static observedAttributes = ['checked'];

  #internals = this.attachInternals();

  get #container() { return this.shadowRoot.querySelector('span'); }

  get checked() { return this.hasAttribute('checked'); }
  set checked(x) { this.toggleAttribute('checked', x); }
  get value() { return this.getAttribute('value') ?? 'on'; }
  set value(v) { this.setAttribute('value', v); }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <span tabindex="0"></span>`;
    this.addEventListener('click', this.#onClick);
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host(:disabled) span {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `);
    this.shadowRoot.adoptedStyleSheets.push(sheet);
  }

  connectedCallback() {
    this.#internals.setFormValue(this.checked ? this.value : null);
    this.#container.textContent = this.checked ? '✅' : '❌';
  }

  formAssociatedCallback(form) {
    console.log('formAssociatedCallback', form);
  }

  formStateRestoreCallback(states) {
    console.log('formStateRestoreCallback', states);
  }

  formResetCallback(...args) {
    console.log('formResetCallback', ...args);
  }

  /**
   * @param {string} _name
   * @param {string} _old
   * @param {string} value
   */
  attributeChangedCallback(_name, _old, value) {
    this.checked = value != null;
    this.connectedCallback();
  }

  #onClick() {
    if (!this.matches(':disabled'))
      this.checked = !this.checked;
  }
}

customElements.define('x-checkbox', XCheckbox);

