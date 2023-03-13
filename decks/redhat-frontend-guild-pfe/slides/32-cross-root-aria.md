---
class: smaller-syntax
---
## Accessibility {slot=heading}

### Cross-Root ARIA

```html
<span id="foo">Description!</span>

<x-foo aria-label="Hello!" aria-describedby="foo">
  <template shadowroot="closed"
            shadowrootdelegatesariaattributes="aria-label aria-describedby">
    <input id="input" delegatedariaattributes="aria-label aria-describedby">
    <span             delegatedariaattributes="aria-label">Another target</span>
  </template>
</x-foo>
```

[github.com/leobalter/cross-root-aria-delegation](https://github.com/leobalter/cross-root-aria-delegation/blob/main/explainer.md)
