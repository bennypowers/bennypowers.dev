## Window and State Management

gnome2-desktop is the WM state store. It manages a `Map<wmId, WMWindowState>` and
exposes derived state via `@lit/context` (activeWindowContext, taskbarContext).

Consumers like gnome2-window-list should subscribe to the WM state context object/s,
rather than querying DOM - this prevents SSR hydration mismatch errors.

Similarly, any state which depends on:
- the structure and state of the DOM
- can be expressed as context
- is global to the whole session,
Should be provided as context from gnome2-desktop.

The general rule: when DOM structure determines state, use context on the parent element.

## Child Registration Pattern (SSR-safe)

When a parent component's render depends on whether specific children exist (e.g.
gtk2-menu-item needs to know if it has a submenu), avoid `querySelector` in `render()`
or `willUpdate()` — it breaks SSR since the DOM shim doesn't support it.

Instead:
1. Use a `@state()` flag on the parent (e.g. `#hasSubmenuChild = false`)
2. The child dispatches a registration event in `connectedCallback` (guarded by `isServer`)
3. The parent listens for the event and sets the flag
4. In `firstUpdated`, the parent also checks via `querySelector` as a fallback
5. During SSR the flag stays `false`; hydration matches; `firstUpdated` updates the flag

Example: `gtk2-menu` dispatches `submenu-register` → `gtk2-menu-item` sets `#hasSubmenuChild`.

For data counts known at template time (e.g. total items in a paginated list), pass the
value as an attribute instead (e.g. `total-items`) so SSR renders the correct state.
