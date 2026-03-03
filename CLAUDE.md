## Maintaining Authenticity
The source material is located in ../gnome2. You MUST Ensure all UI elements are visually consistent with their GNOME 2.20 source inspirations. However, we will use modern technology - custom elements, shadow DOM, css nesting, container queries, etc - to implement them.

## Browser Support
We support all browser features in Baseline 2025

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

## Lit and DOM

In Lit methods, when setting state, use lit `@property`s instead of get/has/setAttribute

```ts
// don't
this.toggleAttribute('has-submenu');
// do
this.hasSubmenu = !this.hasSubmenu;
```

## DOM API and TypeScript
When using DOM API with simple tag name selectors, it's not necessary to issue type assertions

example:

```ts
const menu = this.querySelector('gtk2-menu');
// menu has type Gtk2Menu
```

For complex selectors, prefer to use <> type assertion rather than `as`

```ts
// do
const activeItems = this.querySelectorAll<Gtk2MenuItem>('gtk2-menu-item[active]');
// don't
const inctiveItems = this.querySelectorAll('gtk2-menu-item:not([active])') as NodeListOf<HTMLElement> | null;
```
