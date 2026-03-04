/** Find the first element matching selector in the composed event path */
export function fromComposed(e: Event, selector: string): HTMLElement | null {
  for (const el of e.composedPath()) {
    if (el instanceof HTMLElement && el.matches(selector)) return el;
  }
  return null;
}
