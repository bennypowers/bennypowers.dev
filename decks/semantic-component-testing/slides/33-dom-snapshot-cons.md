---
reveal: pre
title: DOM Snapshot Cons
---
### DOM Snapshot CONs
- Tightly coupled to (private) DOM structure
- Manual snapshot validation
- Can only validate serializable state

```js
// setting default semantics
this.#internals.ariaLabel = "Pick a card"
```

```js
this.#comboboxElement // shadow
  .ariaActiveDescendantElement =
    this.querySelector('x-option[active]'); // light
```

Some of these issues can be resolved by normalizing the actual and expected HTML 
with pkgs like semantic-dom-diff {slot=notes}

