import { LitElement, html, isServer, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import './gtk2-notebook.js';
import styles from './gnome2-appearance-prefs.css';

interface Wallpaper {
  src: string;
  alt: string;
}

@customElement('gnome2-appearance-prefs')
export class Gnome2AppearancePrefs extends LitElement {
  static styles = styles;

  @property({ attribute: 'close-href' }) accessor closeHref = '/';

  @state() accessor #scheme = 'system';
  @state() accessor #wallpaper = '';
  @state() accessor #wpStyle = 'fill';
  @state() accessor #bgColor = '#305573';
  @state() accessor #bgColor2 = '#1a2a3a';
  @state() accessor #colorMode = 'solid';

  static #wallpapers: Wallpaper[] = [
    { src: '', alt: 'Default' },
    { src: '/assets/gnome/wallpapers/branded/GNOME-Curves.png', alt: 'GNOME Curves' },
    { src: '/assets/gnome/wallpapers/nature/FreshFlower.jpg', alt: 'Fresh Flower' },
    { src: '/assets/gnome/wallpapers/nature/GreenMeadow.jpg', alt: 'Green Meadow' },
    { src: '/assets/gnome/wallpapers/nature/OpenFlower.jpg', alt: 'Open Flower' },
  ];

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    try {
      this.#scheme = localStorage.getItem('cl-color-scheme') ?? 'system';
      this.#wallpaper = localStorage.getItem('cl-wallpaper') ?? '';
      this.#wpStyle = localStorage.getItem('cl-wp-style') ?? 'fill';
      this.#bgColor = localStorage.getItem('cl-bg-color') ?? '#305573';
      this.#bgColor2 = localStorage.getItem('cl-bg-color2') ?? '#1a2a3a';
      this.#colorMode = localStorage.getItem('cl-color-mode') ?? 'solid';
    } catch {}
  }

  #selectScheme(scheme: string) {
    this.#scheme = scheme;
    const root = document.documentElement;
    root.style.colorScheme =
      scheme === 'light' ? 'light only' :
      scheme === 'dark' ? 'dark only' : 'light dark';
    root.dataset.scheme = scheme === 'light' || scheme === 'dark' ? scheme : 'system';
    try { localStorage.setItem('cl-color-scheme', scheme); } catch {}
  }

  #selectWallpaper(src: string) {
    this.#wallpaper = src;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-wallpaper', src); } catch {}
  }

  #selectStyle(e: Event) {
    this.#wpStyle = (e.target as HTMLSelectElement).value;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-wp-style', this.#wpStyle); } catch {}
  }

  #selectColorMode(e: Event) {
    this.#colorMode = (e.target as HTMLSelectElement).value;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-color-mode', this.#colorMode); } catch {}
  }

  #selectColor(e: Event, which: 'primary' | 'secondary') {
    const color = (e.target as HTMLInputElement).value;
    if (which === 'primary') this.#bgColor = color;
    else this.#bgColor2 = color;
    this.#applyDesktopBg();
    try {
      localStorage.setItem('cl-bg-color', this.#bgColor);
      localStorage.setItem('cl-bg-color2', this.#bgColor2);
    } catch {}
  }

  #applyDesktopBg() {
    document.getElementById('gnome2-wp-initial')?.remove();
    const desktop = document.querySelector('gnome2-desktop');
    if (!(desktop instanceof HTMLElement)) return;

    const styleMap: Record<string, string> = {
      centered: 'auto no-repeat center',
      fill: 'cover no-repeat center',
      scaled: 'contain no-repeat center',
      zoom: 'cover no-repeat center',
      tiled: 'auto repeat',
    };
    const bgStyle = styleMap[this.#wpStyle] ?? styleMap.fill;

    let colorBg: string;
    if (this.#colorMode === 'horizontal') {
      colorBg = `linear-gradient(to right, ${this.#bgColor}, ${this.#bgColor2})`;
    } else if (this.#colorMode === 'vertical') {
      colorBg = `linear-gradient(to bottom, ${this.#bgColor}, ${this.#bgColor2})`;
    } else {
      colorBg = this.#bgColor;
    }

    if (this.#wallpaper) {
      const [size, repeat, position] = bgStyle.split(' ');
      desktop.style.setProperty('--cl-desktop-bg',
        `url(${this.#wallpaper}) ${position ?? 'center'} / ${size} ${repeat ?? 'no-repeat'}, ${colorBg}`);
    } else {
      desktop.style.setProperty('--cl-desktop-bg', colorBg);
    }
  }

  #renderThemeItem(scheme: string, label: string, previewClass: string, auto = false) {
    return html`
      <button class="theme-item ${classMap({ selected: this.#scheme === scheme })}"
              @click=${() => this.#selectScheme(scheme)}>
        <div class="theme-preview ${previewClass}">
          <div class="preview-titlebar"></div>
          <div class="preview-body">
            <div class="preview-menubar"></div>
            <div class="preview-content">
              ${auto ? html`<span class="preview-auto">Auto</span>` : nothing}
            </div>
          </div>
        </div>
        <span>${label}</span>
      </button>
    `;
  }

  render() {
    return html`
      <gtk2-notebook>
        <button slot="tab-0" class="active">Theme</button>
        <button slot="tab-1">Background</button>

        <div slot="panel-0" id="theme-panel">
          <div class="scroll-container">
            <div id="theme-list">
              ${this.#renderThemeItem('light', 'Clearlooks', 'light-preview')}
              ${this.#renderThemeItem('dark', 'Clearlooks Dark', 'dark-preview')}
              ${this.#renderThemeItem('system', 'System', 'system-preview', true)}
            </div>
          </div>
        </div>

        <div slot="panel-1">
          <div id="bg-panel">
            <div class="section-label">Wallpaper</div>
            <div class="section-content">
              <div class="scroll-container" id="wallpaper-scroll">
                <div id="wallpaper-grid">
                  ${Gnome2AppearancePrefs.#wallpapers.map(({ src, alt }) => html`
                    <button class="wallpaper-item ${classMap({ selected: this.#wallpaper === src })}"
                            @click=${() => this.#selectWallpaper(src)}>
                      ${src
                        ? html`<img class="wallpaper-thumb" src="${src}" alt="${alt}" loading="lazy">`
                        : html`<div class="wallpaper-thumb default-bg"></div>`
                      }
                    </button>
                  `)}
                </div>
              </div>
              <div class="control-row">
                <label for="wp-style">Style:</label>
                <select id="wp-style" .value=${this.#wpStyle} @change=${this.#selectStyle}>
                  <option value="centered">Centered</option>
                  <option value="fill">Fill screen</option>
                  <option value="scaled">Scaled</option>
                  <option value="zoom">Zoom</option>
                  <option value="tiled">Tiled</option>
                </select>
              </div>
            </div>

            <div class="section-label">Colors</div>
            <div class="section-content">
              <div class="control-row">
                <select .value=${this.#colorMode} @change=${this.#selectColorMode}>
                  <option value="solid">Solid color</option>
                  <option value="horizontal">Horizontal gradient</option>
                  <option value="vertical">Vertical gradient</option>
                </select>
                <input type="color" class="color-swatch"
                       .value=${this.#bgColor}
                       @input=${(e: Event) => this.#selectColor(e, 'primary')}>
                ${this.#colorMode !== 'solid' ? html`
                  <input type="color" class="color-swatch"
                         .value=${this.#bgColor2}
                         @input=${(e: Event) => this.#selectColor(e, 'secondary')}>
                ` : nothing}
              </div>
            </div>
          </div>
        </div>
      </gtk2-notebook>

      <div id="button-bar">
        <span id="spacer"></span>
        <a href="${this.closeHref}" id="close-btn">Close</a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-appearance-prefs': Gnome2AppearancePrefs;
  }
}
