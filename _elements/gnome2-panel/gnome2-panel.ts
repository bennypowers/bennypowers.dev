import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './gnome2-panel.css';

/**
 * A horizontal panel bar modeled after gnome-panel 2.20. MUST be placed
 * in `gnome2-desktop`'s `top-panel` or `bottom-panel` slot. Provides
 * three layout regions (start, center, end) for applets. SHOULD set
 * `position` to match the slot used. Applets MUST provide their own
 * ARIA roles for screen reader accessibility.
 *
 * @summary GNOME 2 desktop panel bar
 */
@customElement('gnome2-panel')
export class Gnome2Panel extends LitElement {
  static styles = styles;

  /** Panel position: 'top' or 'bottom'. Controls border styling. */
  @property({ reflect: true }) accessor position: 'top' | 'bottom' = 'top';

  render() {
    return html`
      <!-- The start region of the panel, aligned to the inline start edge. -->
      <div id="start" part="start">
        <!-- Panel applets (block elements) aligned to the start. SHOULD contain gnome2-session for navigation menus. -->
        <slot name="start"></slot>
      </div>
      <!-- The center region, fills remaining space between start and end. -->
      <div id="center" part="center">
        <!-- Panel applets (block elements) in the center region. SHOULD contain gnome2-window-list for keyboard-accessible task switching. -->
        <slot></slot>
      </div>
      <!-- The end region of the panel, aligned to the inline end edge. -->
      <div id="end" part="end">
        <!-- Panel applets (block elements) aligned to the end. SHOULD contain gnome2-clock and gnome2-workspace-switcher. -->
        <slot name="end"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-panel': Gnome2Panel;
  }
}
