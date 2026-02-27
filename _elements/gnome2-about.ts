import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('gnome2-about')
export class Gnome2About extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      line-height: 1.6;
      color: var(--cl-text, light-dark(#2e3436, #eeeeec));
      overflow-y: auto;
    }

    #banner {
      width: 100%;
      height: 80px;
      object-fit: cover;
      object-position: center;
      flex-shrink: 0;
      display: block;
    }

    #separator {
      height: 1px;
      background: var(--cl-menu-separator, light-dark(#d3d7cf, #555753));
      flex-shrink: 0;
    }

    #identity {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 10px;
      flex-shrink: 0;
      inset-block-start: -1.5rem;
      position: relative;
    }

    #logo {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      flex-shrink: 0;
    }

    nav {
      display: flex;
      gap: 5px;
      font-size: var(--cl-font-size, 13px);
      flex-wrap: wrap;
      align-items: center;

      a {
        color: var(--cl-text, light-dark(#2e3436, #eeeeec));
        font-weight: 700;
        text-decoration: underline;

        &:hover {
          color: var(--cl-link, light-dark(#3465a4, #729fcf));
        }
      }

      .dot {
        font-weight: 700;
      }
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      text-align: center;
      margin: 16px 24px 8px;
      color: var(--cl-heading, light-dark(#2e3436, #eeeeec));
    }

    #bio {
      text-align: center;
      padding: 0 32px;
      color: var(--cl-text-secondary, light-dark(#555753, #babdb6));

      a {
        color: var(--cl-link, light-dark(#3465a4, #729fcf));
      }
    }

    #brought {
      text-align: center;
      margin: 20px 0 12px;
    }

    dl {
      padding: 0 24px;
      font-size: var(--cl-font-size, 13px);

      dt {
        font-weight: 700;
        float: inline-start;
        margin-inline-end: 6px;
      }

      dd {
        margin: 0 0 4px;
      }

      a {
        color: var(--cl-link, light-dark(#3465a4, #729fcf));
      }
    }
  `;

  render() {
    return html`
      <img id="banner"
           src="/assets/images/jerusalem-banner.jpg"
           alt="Jerusalem Old City skyline">
      <div id="separator"></div>
      <div id="identity">
        <img id="logo"
             src="/assets/images/bicycle.gif"
             alt=""
             width="64"
             height="64">
        <nav>
          <a href="/posts/">Posts</a>
          <span class="dot">&bull;</span>
          <a href="/tags/">Tags</a>
          <span class="dot">&bull;</span>
          <a href="/decks/">Decks</a>
          <span class="dot">&bull;</span>
          <a href="/resume/">Resume</a>
          <span class="dot">&bull;</span>
          <a href="/feed.xml">RSS</a>
        </nav>
      </div>

      <h1>Welcome</h1>

      <div id="bio">
        <p>
          <strong>Benny Powers</strong>;
          web developer from Jerusalem, Israel;
          gefilte ficcionado, semitic <a href="/tags/html/">HTML</a>.
          During the week, writes Free software at <a href="/tags/redhat/">Red Hat</a>.
          Namely, <a href="/tags/web-components/">Web components</a>
          and <a href="/tags/design-systems/">design systems</a>. Content on this site represents no one but myself</p>
      </div>

      <div id="brought">
        <strong>Brought to you by:</strong>
        <div>The Abishter</div>
      </div>

      <dl>
        <dt>Stack:</dt>
        <dd>, <a href="/tags/css/">CSS</a>, <a href="/tags/typescript/">TypeScript</a>, <a href="/tags/lua/">Lua</a>, <a href="/tags/golang/">Go</a></dd>
        <dt>Platform:</dt>
        <dd><a href="https://fedoraproject.org">Fedora</a> / <a href="/tags/gentoo/">Gentoo</a> GNU/Linux</dd>
        <dt>Editor:</dt>
        <dd><a href="/tags/nvim/">nvim</a></dd>
      </dl>

      <slot name="h-card"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-about': Gnome2About;
  }
}
