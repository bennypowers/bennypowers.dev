---
reveal: .revealer > :not(:first-child)
---
## What is CSS? {slot=heading}

### Responsive Design

The practice of using media queries to change page layout depending on device 
type and screen size.

<div class="revealer">

```css
main { /* mobile */
  display: grid;
  grid-template-columns: 1fr;
}
```

```css
@media (min-width: 500px) { /* tablet */
  main { grid-template-columns: 2fr 1fr; }
}

@media (min-width: 1000px) { /* desktop */
  main { grid-template-columns: 1fr 4fr 1fr; }
}
```

```css
@media (print) {
  main {
    display: block;
  }

  nav {
    display: none;
  }
}
```

<div id="responsive-examples">
  <img alt="mobile phone responsive layout" src="responsive-mobile.svg">
  <img alt="laptop responsive layout" src="responsive-laptop.svg">
  <img alt="print responsive layout" src="responsive-print.svg">
</div>

</div>
