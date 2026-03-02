import { LitElement, html, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import styles from './gnome2-clock.css';

@customElement('gnome2-clock')
export class Gnome2Clock extends LitElement {
  static styles = styles;

  @state() accessor #time = '';

  #timer: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#updateTime();
    this.#timer = setInterval(() => this.#updateTime(), 30000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
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
    this.#time = Gnome2Clock.#fmt.format(new Date());
  }

  render() {
    return html`<time datetime=${new Date().toISOString()}>${this.#time}</time>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-clock': Gnome2Clock;
  }
}
