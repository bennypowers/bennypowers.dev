import { LitElement, html, css, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';

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
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #000;
      color: #fff;
      font-family: sans-serif;
    }
    iframe {
      border: none;
      width: 100%;
      height: 100%;
    }
    .fallback {
      text-align: center;
      padding: 1em;
    }
    .fallback a {
      display: inline-block;
      margin-top: 1em;
      padding: 0.5em 1.5em;
      background: #4a90d9;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }
    .fallback a:hover {
      background: #5aa0e9;
    }
  `;

  @state() accessor #canEmbed = supportsCredentiallessIframe();

  render() {
    if (this.#canEmbed) {
      return html`<iframe src=${SUPERTUX_URL}
                          credentialless
                          allowfullscreen></iframe>`;
    }
    return html`
      <div class="fallback">
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
