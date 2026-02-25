// GNOME Desktop controller
// Manages panel menus and desktop interactions
import 'gnome2/gtk2-button.js';
import 'gnome2/gtk2-window.js';
import 'gnome2/gtk2-scrolled-window.js';
import 'gnome2/gtk2-menu.js';
import 'gnome2/gtk2-menu-item.js';
import 'gnome2/gtk2-menu-bar.js';
import 'gnome2/gtk2-menu-button.js';
import 'gnome2/gnome2-panel.js';
import 'gnome2/gnome2-clock.js';
import 'gnome2/gnome2-window-list.js';
import 'gnome2/gnome2-workspace-switcher.js';
import 'gnome2/gnome2-desktop.js';
import 'gnome2/desktop-icon.js';

class SchemeController {
  static #STORAGE_KEY = 'cl-color-scheme';

  constructor() {
    this.#apply(this.#stored ?? 'system');
    document.addEventListener('click', e => {
      const item = /** @type {HTMLElement} */ (e.target).closest?.('[data-scheme]');
      if (!item) return;
      const scheme = item.dataset.scheme;
      this.#apply(scheme);
      localStorage.setItem(SchemeController.#STORAGE_KEY, scheme);
    });
  }

  get #stored() {
    try { return localStorage.getItem(SchemeController.#STORAGE_KEY); }
    catch { return null; }
  }

  /** @param {string} scheme */
  #apply(scheme) {
    const html = document.documentElement;
    switch (scheme) {
      case 'light':
        html.style.colorScheme = 'light only';
        html.dataset.scheme = 'light';
        break;
      case 'dark':
        html.style.colorScheme = 'dark only';
        html.dataset.scheme = 'dark';
        break;
      default:
        html.style.colorScheme = 'light dark';
        html.dataset.scheme = 'system';
        break;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SchemeController());
} else {
  new SchemeController();
}
