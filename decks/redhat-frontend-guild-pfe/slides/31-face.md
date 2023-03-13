## Accessibility {slot=heading}

### Form-Associated Custom Elements

```html
<label>Label Association
  <x-checkbox checked></x-checkbox></label>
```

### ElementInternals

```js
class FancyElement extends HTMLElement {
  #internals = this.attachInternals();
  set value(v) {
    this.#internals.ariaValueNow = v.toString();
  }
}
```
