## Window and State Management

gnome2-session is the main WM state store.

Consumers like gnome2-window-list should subscribe to the WM state context object/s,
rather than querying DOM - this prevents SSR hydration mismatch errors

Similarly, any state which depends on:
- the structure and state of the DOM
- can be expressed as context
- is global to the whole session,
Should be provided as context from gnome2-session.

The general rule: when DOM structure determines state, use context on the parent element.
