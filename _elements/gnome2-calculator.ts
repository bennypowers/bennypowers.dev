import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('gnome2-calculator')
export class Gnome2Calculator extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      padding: 6px;
      gap: 4px;
    }

    #display {
      background: light-dark(#ffffff, #1a1a1a);
      border: 2px solid light-dark(#9d9c9b, #555753);
      box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.08);
      padding: 8px 6px 8px 8px;
      font-size: 20px;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      text-align: end;
      color: light-dark(#2e3436, #eeeeec);
      min-height: 32px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 6px;
      flex: 1;
    }

    button {
      font-family: inherit;
      font-size: 13px;
      padding: 4px;
      min-height: 28px;
      border: 1px solid light-dark(#9d9c9b, #1a1a1a);
      border-radius: 3px;
      background: var(--cl-button-bg, linear-gradient(to bottom, #fefefe, #f0efee, #e6e5e4, #dadddb));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      color: light-dark(#2e3436, #eeeeec);
      cursor: default;

      &:hover {
        background: var(--cl-button-bg-hover);
      }

      &:active {
        background: var(--cl-button-bg-active);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
      }
    }

    .op {
      font-weight: 700;
    }

  `;

  @state() accessor #display = '0';
  @state() accessor #accumulator = 0;
  @state() accessor #operator = '';
  @state() accessor #resetNext = false;

  #input(digit: string) {
    if (this.#resetNext || this.#display === '0') {
      this.#display = digit;
      this.#resetNext = false;
    } else {
      this.#display += digit;
    }
  }

  #decimal() {
    if (this.#resetNext) {
      this.#display = '0.';
      this.#resetNext = false;
    } else if (!this.#display.includes('.')) {
      this.#display += '.';
    }
  }

  #op(operator: string) {
    this.#evaluate();
    this.#accumulator = parseFloat(this.#display);
    this.#operator = operator;
    this.#resetNext = true;
  }

  #evaluate() {
    if (!this.#operator) return;
    const current = parseFloat(this.#display);
    let result: number;
    switch (this.#operator) {
      case '+': result = this.#accumulator + current; break;
      case '-': result = this.#accumulator - current; break;
      case '×': result = this.#accumulator * current; break;
      case '÷': result = current === 0 ? NaN : this.#accumulator / current; break;
      default: return;
    }
    this.#display = Number.isNaN(result) ? 'Error' : String(result);
    this.#operator = '';
    this.#resetNext = true;
  }

  #clear() {
    this.#display = '0';
    this.#accumulator = 0;
    this.#operator = '';
    this.#resetNext = false;
  }

  #clearEntry() {
    this.#display = '0';
  }

  #backspace() {
    if (this.#display.length <= 1 || this.#display === 'Error') {
      this.#display = '0';
    } else {
      this.#display = this.#display.slice(0, -1);
    }
  }

  #negate() {
    if (this.#display !== '0' && this.#display !== 'Error') {
      this.#display = this.#display.startsWith('-')
        ? this.#display.slice(1)
        : '-' + this.#display;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') this.#input(e.key);
    else if (e.key === '.') this.#decimal();
    else if (e.key === '+') this.#op('+');
    else if (e.key === '-') this.#op('-');
    else if (e.key === '*') this.#op('×');
    else if (e.key === '/') { e.preventDefault(); this.#op('÷'); }
    else if (e.key === 'Enter' || e.key === '=') this.#evaluate();
    else if (e.key === 'Escape') this.#clear();
    else if (e.key === 'Backspace') this.#backspace();
    else if (e.key === 'Delete') this.#clearEntry();
  };

  render() {
    return html`
      <div id="display">${this.#display}</div>
      <div id="buttons">
        <button @click=${this.#backspace}>Bksp</button>
        <button @click=${this.#clearEntry}>CE</button>
        <button @click=${this.#clear}>Clr</button>
        <button @click=${this.#negate}>±</button>

        <button @click=${() => this.#input('7')}>7</button>
        <button @click=${() => this.#input('8')}>8</button>
        <button @click=${() => this.#input('9')}>9</button>
        <button @click=${() => this.#op('÷')} class="op">÷</button>

        <button @click=${() => this.#input('4')}>4</button>
        <button @click=${() => this.#input('5')}>5</button>
        <button @click=${() => this.#input('6')}>6</button>
        <button @click=${() => this.#op('×')} class="op">×</button>

        <button @click=${() => this.#input('1')}>1</button>
        <button @click=${() => this.#input('2')}>2</button>
        <button @click=${() => this.#input('3')}>3</button>
        <button @click=${() => this.#op('-')} class="op">−</button>

        <button @click=${() => this.#input('0')}>0</button>
        <button @click=${this.#decimal}>.</button>
        <button @click=${this.#evaluate} class="op">=</button>
        <button @click=${() => this.#op('+')} class="op">+</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-calculator': Gnome2Calculator;
  }
}
