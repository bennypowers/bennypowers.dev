---
class: smaller-syntax
---
## What are Web Components? {slot=heading}

### Custom Elements

In the <abbr title="document object model">DOM</abbr>, each element relates to a 
specific class. **Custom Elements** are HTML tags containing a hyphen which are 
linked to a user-defined JavaScript class through the `customElements` 
namespace.

```js
class FancyElement extends HTMLElement {
  fanciness = 11;
}

customElements.define('fancy-element', FancyElement);
```
