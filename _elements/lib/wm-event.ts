export type WMEventType =
  | 'focus'
  | 'close'
  | 'move'
  | 'minimize'
  | 'restore'
  | 'show-desktop'
  | 'workspace-switch';

/**
 * Unified window manager event. Dispatched by window and panel elements,
 * handled by gnome2-desktop's WM controller.
 *
 * @summary Unified WM event with wmEventType discriminator
 */
export class WMEvent extends Event {
  constructor(
    public wmEventType: WMEventType,
    public wmId: string = '',
    public url: string = wmId,
    public detail: Record<string, unknown> = {},
  ) {
    super('wm-event', { bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    'wm-event': WMEvent;
  }
}
