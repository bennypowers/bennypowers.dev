import { LitElement, html, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import styles from './gnome2-supertux.css';

const SUPERTUX_URL = 'https://play.supertux.org/releases/0.6.3/';

function supportsCredentiallessIframe(): boolean {
  if (isServer) return false;
  try {
    return 'credentialless' in HTMLIFrameElement.prototype;
  } catch {
    return false;
  }
}

@customElement('gnome2-supertux')
export class Gnome2Supertux extends LitElement {
  static styles = styles;

  @state() accessor #canEmbed = supportsCredentiallessIframe();

  render() {
    if (this.#canEmbed) {
      return html`<iframe src=${SUPERTUX_URL}
                          credentialless
                          allowfullscreen></iframe>`;
    }
    return html`
      <div id="fallback">
        <p>Your browser doesn't support <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/IFrame_credentialless">credentialless iframes</a> yet.</p>
        <a href=${SUPERTUX_URL} target="_blank" rel="noopener">Open SuperTux in a new tab</a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-supertux': Gnome2Supertux;
  }
}
