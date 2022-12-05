## What are Web Components? {slot=heading}

### CSS Shadow Parts

Shadow DOM:
```html
<div id="content" part="content">
  <slot></slot>
</slot>
```

Light CSS:
```css
x-element::part(content) {
  background: red;
}
```

