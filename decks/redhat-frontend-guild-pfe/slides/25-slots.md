---
reveal: pre
---
## What are Web Components? {slot=heading}

### The `<slot>` Element

Projects contents from the "light" DOM into positions in the Shadow Root.

<div class="revealer">
  <img alt="firefox element inspector showing a slotted element" src="slotted.png">

  ```css
  ::slotted(h2) {
    color: var(--rh-color-brand-red-on-light);
  }
  ```

</div>
