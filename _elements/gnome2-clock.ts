import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('gnome2-clock')
export class Gnome2Clock extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      color: var(--cl-panel-text, #2e3436);
      cursor: default;
      white-space: nowrap;
      height: 100%;
    }

    :host(:hover) {
      background: rgba(0, 0, 0, 0.06);
    }

    time {
      display: block;
    }
  `;

  @state() accessor _time = '';

  #timer: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.#updateTime();
    this.#timer = setInterval(() => this.#updateTime(), 30000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  static #fmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  #updateTime() {
    this._time = Gnome2Clock.#fmt.format(new Date());
  }

  render() {
    return html`<time datetime=${new Date().toISOString()}>${this._time}</time>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-clock': Gnome2Clock;
  }
}
