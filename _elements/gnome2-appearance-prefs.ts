import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import './gtk2-notebook.js';

interface Wallpaper {
  src: string;
  alt: string;
}

@customElement('gnome2-appearance-prefs')
export class Gnome2AppearancePrefs extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      font-size: var(--cl-font-size, 13px);
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
    }

    gtk2-notebook {
      flex: 1;
      min-height: 0;
    }

    .theme-panel {
      height: 100%;

      .scroll-container {
        height: 100%;
      }
    }

    .scroll-container {
      overflow-y: auto;
      overflow-x: hidden;
      border: 1px solid light-dark(#9d9c9b, #555753);
      background: light-dark(#ffffff, #1a1a1a);
      box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.08);
    }

    .theme-list {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      padding: 18px;
    }

    .theme-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 6px;
      border: 2px solid transparent;
      border-radius: 3px;
      background: none;
      cursor: default;
      font-family: inherit;
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#2e3436, #eeeeec);

      &:hover {
        border-color: light-dark(#729fcf, #4a6a8a);
      }

      &.selected {
        border-color: light-dark(#86abd9, #729fcf);
        background: light-dark(rgba(134, 171, 217, 0.12), rgba(114, 159, 207, 0.15));
      }
    }

    .theme-preview {
      width: 138px;
      height: 92px;
      border-radius: 3px 3px 0 0;
      border: 1px solid light-dark(#9d9c9b, #555753);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .preview-titlebar { height: 12px; flex-shrink: 0; }
    .preview-body { flex: 1; display: flex; flex-direction: column; }
    .preview-menubar { height: 8px; flex-shrink: 0; }
    .preview-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
    }

    .light-preview {
      .preview-titlebar { background: linear-gradient(to bottom, #93b3d3, #6a92b8); }
      .preview-menubar { background: #edeceb; }
      .preview-content { background: #ffffff; }
    }

    .dark-preview {
      .preview-titlebar { background: linear-gradient(to bottom, #4a6a8a, #3a5570); }
      .preview-menubar { background: #2e3436; }
      .preview-content { background: #1a1a1a; color: #babdb6; }
    }

    .system-preview {
      .preview-titlebar { background: linear-gradient(to bottom, #93b3d3, #6a92b8); }
      .preview-menubar { background: linear-gradient(to right, #edeceb 50%, #2e3436 50%); }
      .preview-content { background: linear-gradient(to right, #ffffff 50%, #1a1a1a 50%); }
    }

    .preview-auto {
      background: rgba(128, 128, 128, 0.6);
      padding: 1px 4px;
      border-radius: 2px;
      color: #fff;
    }

    .section-label {
      font-weight: 700;
      font-size: var(--cl-font-size, 13px);
      color: light-dark(#2e3436, #eeeeec);
      padding: 0;
      margin: 0;
    }

    .section-content {
      padding-inline-start: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bg-panel {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .wallpaper-scroll {
      max-height: 200px;
    }

    .wallpaper-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3px;
      padding: 3px;
    }

    .wallpaper-item {
      padding: 2px;
      border: 2px solid transparent;
      border-radius: 2px;
      background: none;
      cursor: default;

      &:hover {
        border-color: light-dark(#729fcf, #4a6a8a);
      }

      &.selected {
        border-color: light-dark(#86abd9, #729fcf);
      }
    }

    .wallpaper-thumb {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 1px;
      display: block;
    }

    .default-bg {
      background: light-dark(#305573, #1a2a3a);
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    select {
      font-family: inherit;
      font-size: var(--cl-font-size-small, 11px);
      padding: 2px 4px;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 3px;
      background: var(--cl-button-bg);
      color: light-dark(#2e3436, #eeeeec);
      cursor: default;
    }

    .color-swatch {
      width: 28px;
      height: 18px;
      padding: 0;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 3px;
      cursor: default;
      appearance: none;
      -webkit-appearance: none;

      &::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      &::-webkit-color-swatch {
        border: none;
        border-radius: 2px;
      }
    }

    .button-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      flex-shrink: 0;
    }

    .spacer { flex: 1; }

    .dialog-button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border: 1px solid light-dark(#9d9c9b, #1a1a1a);
      border-radius: 3px;
      background: var(--cl-button-bg);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      font-family: inherit;
      font-size: 12px;
      color: light-dark(#2e3436, #eeeeec);
      text-decoration: none;
      cursor: default;

      &:hover {
        background: var(--cl-button-bg-hover);
      }

      &:active {
        background: var(--cl-button-bg-active);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
      }
    }
  `;

  @property({ attribute: 'close-href' }) accessor closeHref = '/';

  @state() accessor _scheme = 'system';
  @state() accessor _wallpaper = '';
  @state() accessor _wpStyle = 'fill';
  @state() accessor _bgColor = '#305573';
  @state() accessor _bgColor2 = '#1a2a3a';
  @state() accessor _colorMode = 'solid';

  static #wallpapers: Wallpaper[] = [
    { src: '', alt: 'Default' },
    { src: '/assets/gnome/wallpapers/branded/GNOME-Curves.png', alt: 'GNOME Curves' },
    { src: '/assets/gnome/wallpapers/nature/FreshFlower.jpg', alt: 'Fresh Flower' },
    { src: '/assets/gnome/wallpapers/nature/GreenMeadow.jpg', alt: 'Green Meadow' },
    { src: '/assets/gnome/wallpapers/nature/OpenFlower.jpg', alt: 'Open Flower' },
  ];

  connectedCallback() {
    super.connectedCallback();
    try {
      this._scheme = localStorage.getItem('cl-color-scheme') ?? 'system';
      this._wallpaper = localStorage.getItem('cl-wallpaper') ?? '';
      this._wpStyle = localStorage.getItem('cl-wp-style') ?? 'fill';
      this._bgColor = localStorage.getItem('cl-bg-color') ?? '#305573';
      this._bgColor2 = localStorage.getItem('cl-bg-color2') ?? '#1a2a3a';
      this._colorMode = localStorage.getItem('cl-color-mode') ?? 'solid';
    } catch {}
  }

  #selectScheme(scheme: string) {
    this._scheme = scheme;
    const root = document.documentElement;
    root.style.colorScheme =
      scheme === 'light' ? 'light only' :
      scheme === 'dark' ? 'dark only' : 'light dark';
    root.dataset.scheme = scheme === 'light' || scheme === 'dark' ? scheme : 'system';
    try { localStorage.setItem('cl-color-scheme', scheme); } catch {}
  }

  #selectWallpaper(src: string) {
    this._wallpaper = src;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-wallpaper', src); } catch {}
  }

  #selectStyle(e: Event) {
    this._wpStyle = (e.target as HTMLSelectElement).value;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-wp-style', this._wpStyle); } catch {}
  }

  #selectColorMode(e: Event) {
    this._colorMode = (e.target as HTMLSelectElement).value;
    this.#applyDesktopBg();
    try { localStorage.setItem('cl-color-mode', this._colorMode); } catch {}
  }

  #selectColor(e: Event, which: 'primary' | 'secondary') {
    const color = (e.target as HTMLInputElement).value;
    if (which === 'primary') this._bgColor = color;
    else this._bgColor2 = color;
    this.#applyDesktopBg();
    try {
      localStorage.setItem('cl-bg-color', this._bgColor);
      localStorage.setItem('cl-bg-color2', this._bgColor2);
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
    const bgStyle = styleMap[this._wpStyle] ?? styleMap.fill;

    let colorBg: string;
    if (this._colorMode === 'horizontal') {
      colorBg = `linear-gradient(to right, ${this._bgColor}, ${this._bgColor2})`;
    } else if (this._colorMode === 'vertical') {
      colorBg = `linear-gradient(to bottom, ${this._bgColor}, ${this._bgColor2})`;
    } else {
      colorBg = this._bgColor;
    }

    if (this._wallpaper) {
      const [size, repeat, position] = bgStyle.split(' ');
      desktop.style.setProperty('--cl-desktop-bg',
        `url(${this._wallpaper}) ${position ?? 'center'} / ${size} ${repeat ?? 'no-repeat'}, ${colorBg}`);
    } else {
      desktop.style.setProperty('--cl-desktop-bg', colorBg);
    }
  }

  #renderThemeItem(scheme: string, label: string, previewClass: string, auto = false) {
    return html`
      <button class="theme-item ${classMap({ selected: this._scheme === scheme })}"
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

        <div slot="panel-0" class="theme-panel">
          <div class="scroll-container">
            <div class="theme-list">
              ${this.#renderThemeItem('light', 'Clearlooks', 'light-preview')}
              ${this.#renderThemeItem('dark', 'Clearlooks Dark', 'dark-preview')}
              ${this.#renderThemeItem('system', 'System', 'system-preview', true)}
            </div>
          </div>
        </div>

        <div slot="panel-1">
          <div class="bg-panel">
            <div class="section-label">Wallpaper</div>
            <div class="section-content">
              <div class="scroll-container wallpaper-scroll">
                <div class="wallpaper-grid">
                  ${Gnome2AppearancePrefs.#wallpapers.map(({ src, alt }) => html`
                    <button class="wallpaper-item ${classMap({ selected: this._wallpaper === src })}"
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
                <select id="wp-style" .value=${this._wpStyle} @change=${this.#selectStyle}>
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
                <select .value=${this._colorMode} @change=${this.#selectColorMode}>
                  <option value="solid">Solid color</option>
                  <option value="horizontal">Horizontal gradient</option>
                  <option value="vertical">Vertical gradient</option>
                </select>
                <input type="color" class="color-swatch"
                       .value=${this._bgColor}
                       @input=${(e: Event) => this.#selectColor(e, 'primary')}>
                ${this._colorMode !== 'solid' ? html`
                  <input type="color" class="color-swatch"
                         .value=${this._bgColor2}
                         @input=${(e: Event) => this.#selectColor(e, 'secondary')}>
                ` : nothing}
              </div>
            </div>
          </div>
        </div>
      </gtk2-notebook>

      <div class="button-bar">
        <span class="spacer"></span>
        <a href="${this.closeHref}" class="dialog-button">Close</a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-appearance-prefs': Gnome2AppearancePrefs;
  }
}
