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

  formDisabledCallback(state) {
    console.log('formDisabledCallback', state);
  }

  formStateRestoreCallback(states) {
    console.log('formStateRestoreCallback', states);
  }

  formResetCallback(...args) {
    console.log('formResetCallback', ...args);
  }

  /**
   * @param {typeof XCheckbox['observedAttributes'][number]} name
   * @param {string} _old
   * @param {string} value
   */
  attributeChangedCallback(name, _old, value) {
    switch (name) {
      case 'checked': this.checked = value != null; break;
      case 'value': this.value = value; break;
      case 'required':
        if (value == null || this.checked)
          this.#internals.setValidity({})
        else
          this.#internals.setValidity({valueMissing: true}, value || 'Must check this box', this.#internals.form);
    }
    this.connectedCallback();
  }

  #onClick() {
    if (!this.matches(':disabled'))
      this.checked = !this.checked;
  }
}

customElements.define('x-checkbox', XCheckbox);

