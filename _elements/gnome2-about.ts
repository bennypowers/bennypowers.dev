import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './gnome2-about.css';

@customElement('gnome2-about')
export class Gnome2About extends LitElement {
  static styles = styles;

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
