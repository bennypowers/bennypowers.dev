## What are Web Components? {slot=heading}

### Declarative Shadow DOM
```html
<host-element>
  <template shadowrootmode="open">
    <style>shadow styles</style>
    <h2>Shadow Content</h2>
    <slot></slot>
  </template>
  <h2>Light content</h2>
</host-element>
```

[github.com/mfreed7/declarative-shadow-dom](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md)
