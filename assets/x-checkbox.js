class XCheckbox extends HTMLElement {
  static formAssociated = true;

  static observedAttributes = ['checked', 'value'];

  static template = document.createElement('template');
  static {
    this.template.innerHTML = `<span tabindex="0" aria-hidden="true"></span>`;
  }

  #internals = this.attachInternals();

  #disabled = this.matches(':disabled');

  get #container() { return this.shadowRoot.querySelector('span'); }

  get checked() { return this.hasAttribute('checked'); }
  set checked(x) { this.toggleAttribute('checked', x); }
  get value() { return this.getAttribute('value') ?? 'on'; }
  set value(v) { this.setAttribute('value', v); }

  constructor() {
    super();
    if ('role' in ElementInternals.prototype)
      this.#internals.role = 'checkbox';
    else // FF 107
      this.setAttribute('role', 'checkbox');
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    this.attachShadow({ mode: 'open' })
      .append(XCheckbox.template.content.cloneNode(true));
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
    if ('ariaChecked' in ElementInternals.prototype)
      this.#internals.ariaChecked = String(this.checked);
    else
      this.setAttribute('aria-checked', String(this.checked));
  }

  /**
   * @param {typeof XCheckbox['observedAttributes'][number]} name
   * @param {string} _old
   * @param {string} value
   */
  attributeChangedCallback(name, _old, value) {
    switch (name) {
      case 'checked': this.checked = value != null; break;
      case 'value': if (value !== this.value) this.value = value; break;
      case 'required':
        if (value == null || this.checked)
          this.#internals.setValidity({})
        else
          this.#internals.setValidity({valueMissing: true}, value || 'Must check this box', this.#internals.form);
    }
    this.connectedCallback();
  }

  formAssociatedCallback(form) {
    console.log('formAssociatedCallback', form);
  }

  /**
   * @param {boolean} state
   */
  formDisabledCallback(state) {
    this.#disabled = state;
    console.log('formDisabledCallback', state);
  }

  formStateRestoreCallback(states) {
    console.log('formStateRestoreCallback', states);
  }

  formResetCallback(...args) {
    console.log('formResetCallback', ...args);
  }

  #onClick() {
    if (!this.#disabled)
      this.#toggle();
  }

  /**
   * @param {KeyboardEvent} event
   */
  #onKeydown(event) {
    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.#toggle();
    }
  }

  #toggle() {
    this.checked = !this.checked;
  }
}

customElements.define('x-checkbox', XCheckbox);

