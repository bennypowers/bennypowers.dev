---
class: smaller-syntax
reveal: pre
---
## Libraries and Ecosystem {slot=heading}

## Lit

The 'original' web components library

- Adds **declarative rendering** and **reactivity** on top of `HTMLElement`
- Works well with (but does **not** require) TypeScript
- Performant updates - no VDOM overhead
- Just JavaScript - no babel, no JSX

```ts
@customElement('lit-thingy') class LitThingy extends LitElement {
  @property() type: 'saucy'|'sassy';
  render() {
    return html`
      <span>feeling ${this.type}</span>
    `;
  }
}
```
