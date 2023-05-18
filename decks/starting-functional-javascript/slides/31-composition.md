---
attrs: id="composition-class-mixins" fade-in background="--primary"
---
## Use Case: Class Mixins

<p slot=notes>JavaScript class mixins are a way to share behaviour among classes</p>

```js
const DraggableMixin = superclass => class extends superclass {
  onDragstart(event) { /* ... */ }
  onDrop(event) { /* ... */ }
}
```

```js
@customElement('draggable-image')
class DraggableImage extends DraggableMixin(LitElement) {
  @property({ type: String, reflect: true }) src = '';
  @property({ type: String, reflect: true }) alt = '';
  render() { return html`<img src="${this.src}" alt="${this.alt}">` }
}
```

<style>
#composition-class-mixins pre { font-size: 80%; }
</style>
