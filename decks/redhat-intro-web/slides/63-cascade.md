## What is CSS? {slot=heading}

CSS Rules *cascade*, meaning they layer onto each other in the order they are 
declared. The cascade and *specificity* This is how conflicts are resolved in 
stylesheets

```css
h1, h2 {
  font-style: italic;
  color: purple;
}

h2 {
  color: red;
}
```

<div reveal style="inset:30% 0 0 50%;position: absolute;">
  <template shadowroot="open">
    <h1>H1</h1>
    <h2>H2</h2>
    <style>
      h1, h2 {
        font-style: italic;
        color: purple;
      }
      h2 {
        color: red;
      }
    </style>
  </template>
</div>


**ASK**: what colour will the h2 be? what style? {slot=notes}
