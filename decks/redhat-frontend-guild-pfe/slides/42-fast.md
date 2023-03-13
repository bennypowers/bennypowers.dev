---
class: smaller-syntax
reveal: pre
---
## Libraries and Ecosystem {slot=heading}

## FAST

Microsoft's Web Component framework and Design System

- Declarative functional templates combined with class components
- Innovative data binding system with Observables
- Comes with it's own design system

```ts
const template = html<FASTThingy>`
  <span>feeling ${x => x.type}</span>
`;
@customElement({
  name: 'fast-thingy',
  template
})
class FASTThingy extends FASTElement {
  @attr() type: 'saucy'|'sassy';
}
```
