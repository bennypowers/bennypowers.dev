// Barrel imports — register all gnome2 custom elements
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import './gnome2-desktop.js';
import './desktop-icon.js';
import './gnome2-clock.js';
import './gnome2-panel.js';
import './gnome2-window-list.js';
import './gtk2-window.js';
import './gtk2-scrolled-window.js';
import './gtk2-button.js';
import './gtk2-menu.js';
import './gtk2-menu-item.js';
import './gtk2-menu-button.js';
import './gtk2-menu-bar.js';
import './gtk2-notebook.js';
import './gnome2-appearance-prefs.js';
import './gnome2-about.js';
import './pidgin-conversation.js';
import './pidgin-message.js';
import './gnome2-workspace-switcher.js';
import './gnome2-wm.js';
import './ooo-impress.js';
import './ooo-impress-deck.js';
import './nautilus-paginated.js';

import { LitElement, html, css, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { Gtk2MenuButton } from './gtk2-menu-button.js';

interface AppDef {
  module: string;
  tag: string;
  label: string;
  icon: string;
  width: string;
  height: string;
  attrs?: () => Record<string, string>;
}

const APP_DEFS: Record<string, AppDef> = {
  calculator: {
    module: 'gnome2/gnome2-calculator.js',
    tag: 'gnome2-calculator',
    label: 'Calculator',
    icon: 'apps/accessories-calculator',
    width: '260px',
    height: '320px',
  },
  mines: {
    module: 'gnome2/gnome2-mines.js',
    tag: 'gnome2-mines',
    label: 'Mines',
    icon: 'categories/applications-games',
    width: '280px',
    height: '360px',
  },
  supertux: {
    module: 'gnome2/gnome2-supertux.js',
    tag: 'gnome2-supertux',
    label: 'SuperTux',
    icon: 'apps/supertux',
    width: '800px',
    height: '600px',
  },
  about: {
    module: 'gnome2/gnome2-about.js',
    tag: 'gnome2-about',
    label: 'About bennypowers.dev',
    icon: 'status/dialog-information',
    width: '550px',
    height: '500px',
  },
  pidgin: {
    module: 'gnome2/pidgin-conversation.js',
    tag: 'pidgin-conversation',
    label: 'Conversation',
    icon: 'apps/internet-group-chat',
    width: '450px',
    height: '400px',
    attrs: () => ({ 'post-url': `https://bennypowers.dev${location.pathname}` }),
  },
};

async function launchApp(id: string) {
  const existing = document.querySelector(`gtk2-window[data-app="${id}"]`);
  if (existing) {
    (existing as HTMLElement).style.display = '';
    existing.setAttribute('focused', '');
    return;
  }
  const def = APP_DEFS[id];
  if (!def) return;
  await import(def.module);
  const desktop = document.querySelector('gnome2-desktop');
  if (!desktop) return;
  const win = document.createElement('gtk2-window');
  win.setAttribute('label', def.label);
  win.setAttribute('icon', def.icon);
  win.setAttribute('dialog', '');
  win.setAttribute('focused', '');
  win.setAttribute('data-app', id);
  win.setAttribute('window-url', `app:${id}`);
  try {
    win.setAttribute('data-workspace', sessionStorage.getItem('gnome2-wm-workspace') || '0');
  } catch { win.setAttribute('data-workspace', '0'); }
  win.style.width = def.width;
  win.style.height = def.height;
  win.style.position = 'absolute';
  win.style.zIndex = '200';
  win.style.insetBlockStart = '40px';
  win.style.insetInlineEnd = '40px';
  const child = document.createElement(def.tag);
  if (def.attrs) {
    for (const [k, v] of Object.entries(def.attrs())) child.setAttribute(k, v);
  }
  win.appendChild(child);
  desktop.appendChild(win);
  win.addEventListener('close', () => {
    win.remove();
    try { sessionStorage.removeItem('app-' + id); } catch {}
  });
  try { sessionStorage.setItem('app-' + id, '1'); } catch {}
}

const GNOME_FOOT = html`<svg slot="icon"
     class="gnome-foot"
     width="14"
     height="17"
     viewBox="0 0 256 315"
     aria-hidden="true"
     style="width:14px;height:17px;flex-shrink:0">
  <path d="M210.657507,136.722855 C221.271049,199.786823 60.255982,222.815204 120.885408,268.975729 C139.930716,283.476557 159.37779,272.368125 156.432393,249.874546 C153.973903,231.108612 222.388546,219.744752 217.02989,248.10518 C210.013619,285.296479 172.511017,314.654669 139.997234,314.654669 C73.9053856,314.654669 10.5647037,237.797619 22.9449521,182.399134 C41.2346204,100.49207 201.847922,84.3761951 210.657507,136.722855 Z M30.4587758,128.919014 C16.5140343,135.054594 -15.1589673,95.4926099 8.54256983,79.1159865 C32.2547497,62.7420237 44.4035172,122.780774 30.4587758,128.919014 Z M69.7493684,97.4934582 C53.1625494,100.883193 28.0481792,50.4495787 57.6564758,38.2316331 C87.2594509,26.0163483 86.3494907,94.1090447 69.7493684,97.4934582 Z M229.008372,0 C294.469635,0 224.913552,93.2336735 188.094751,93.2336735 C151.27063,93.2336735 163.549772,0 229.008372,0 Z M120.316018,81.6809037 C100.70132,80.4835876 87.7463596,16.4191946 124.583785,11.6379124 C161.434513,6.85663014 139.922734,82.8782197 120.316018,81.6809037 Z"
        fill="currentColor" />
</svg>`;

@customElement('gnome2-session')
export class Gnome2Session extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: stretch;
      height: 100%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    document.addEventListener('click', this.#onSchemeClick);
    document.addEventListener('click', this.#onLaunchClick);
    try {
      for (const id of Object.keys(APP_DEFS)) {
        if (sessionStorage.getItem('app-' + id)) launchApp(id);
      }
    } catch {}
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#onSchemeClick);
    document.removeEventListener('click', this.#onLaunchClick);
  }

  /** Find the first element matching selector in the composed event path */
  static #fromComposed(e: Event, selector: string): HTMLElement | null {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && el.matches(selector)) return el;
    }
    return null;
  }

  #onSchemeClick = (e: MouseEvent) => {
    const item = Gnome2Session.#fromComposed(e, '[data-scheme]');
    if (!item) return;
    const scheme = item.dataset.scheme!;
    const root = document.documentElement;
    root.style.colorScheme =
      scheme === 'light' ? 'light only' :
      scheme === 'dark' ? 'dark only' : 'light dark';
    root.dataset.scheme = scheme === 'light' || scheme === 'dark' ? scheme : 'system';
    try { localStorage.setItem('cl-color-scheme', scheme); } catch {};
  };

  #onLaunchClick = (e: MouseEvent) => {
    const item = Gnome2Session.#fromComposed(e, '[data-launch]');
    if (!item) return;
    e.preventDefault();
    // Close menus in both document and shadow DOMs
    for (const mb of document.querySelectorAll('gtk2-menu-button[open]')) {
      (mb as Gtk2MenuButton).hide();
    }
    for (const mb of this.shadowRoot?.querySelectorAll('gtk2-menu-button[open]') ?? []) {
      (mb as Gtk2MenuButton).hide();
    }
    launchApp(item.dataset.launch!);
  };

  render() {
    return html`
      <gtk2-menu-bar>
        <gtk2-menu-button label="Applications">
          ${GNOME_FOOT}
          <gtk2-menu-item label="Accessories"
                          icon="categories/applications-accessories">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Calculator"
                              data-launch="calculator"
                              icon="apps/accessories-calculator"></gtk2-menu-item>
              <gtk2-menu-item label="Text Editor"
                              href="/posts/"
                              icon="apps/accessories-text-editor"></gtk2-menu-item>
              <gtk2-menu-item label="Terminal"
                              href="https://github.com/bennypowers"
                              icon="apps/utilities-terminal"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Games"
                          icon="categories/applications-games">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Mines"
                              data-launch="mines"
                              icon="categories/applications-games"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Internet"
                          icon="categories/applications-internet">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Pidgin Internet Messenger"
                              data-launch="pidgin"
                              icon="apps/internet-group-chat"></gtk2-menu-item>
              <gtk2-menu-item label="Web Browser"
                              href="/decks/"
                              icon="apps/internet-web-browser"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
        </gtk2-menu-button>

        <gtk2-menu-button label="Places">
          <gtk2-menu-item label="Home"
                          href="/"
                          icon="places/user-home"></gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="Posts"
                          href="/posts/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-posts"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Tags"
                          href="/tags/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-tags"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item label="Decks"
                          href="/decks/"
                          icon="places/folder">
            <gtk2-menu slot="submenu">
              <slot name="places-decks"></slot>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="GitHub"
                          href="https://github.com/bennypowers"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="GitLab"
                          href="https://gitlab.com/bennyp"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="Mastodon"
                          href="https://social.bennypowers.com/@bp"
                          icon="apps/internet-group-chat"></gtk2-menu-item>
          <gtk2-menu-item label="LinkedIn"
                          href="https://il.linkedin.com/in/bennypowers"
                          icon="places/network-server"></gtk2-menu-item>
          <gtk2-menu-item label="StackOverflow"
                          href="https://stackexchange.com/users/2936504/benny-powers"
                          icon="apps/internet-web-browser"></gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="RSS Feed"
                          href="/feed.xml"
                          icon="mimetypes/application-rss+xml"></gtk2-menu-item>
        </gtk2-menu-button>

        <gtk2-menu-button label="System">
          <gtk2-menu-item label="Preferences"
                          icon="categories/preferences-desktop">
            <gtk2-menu slot="submenu">
              <gtk2-menu-item label="Appearance"
                              href="/appearance/"
                              icon="apps/preferences-desktop-theme"></gtk2-menu-item>
            </gtk2-menu>
          </gtk2-menu-item>
          <gtk2-menu-item separator></gtk2-menu-item>
          <gtk2-menu-item label="Help"
                          href="/help/"
                          icon="apps/help-browser"></gtk2-menu-item>
          <gtk2-menu-item label="About"
                          data-launch="about"
                          icon="status/dialog-information"></gtk2-menu-item>
        </gtk2-menu-button>
      </gtk2-menu-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-session': Gnome2Session;
  }
}
