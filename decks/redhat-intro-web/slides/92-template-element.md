---
class: smaller-syntax
---

## What are Web Components? {slot=heading}

### The `<template>` Element

Parse HTML into the DOM once, clone it cheaply many times.

```html
<template id="fancy-template">
  <article>
    <h2>Name</h2>
    <p class="description"></p>
    <footer><a>Read More</a></footer>
  </article>
</template>
```

```js
document.getElementById('fancy-template')
  .content
  .cloneNode(true);
```

