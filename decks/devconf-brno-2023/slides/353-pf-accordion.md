---
class: feature
---
## `<pf-accordion>` {slot=title}

An **accordion** is an interactive container that expands and collapses to hide 
or reveal nested content. It takes advantage of progressive disclosure to help 
reduce page scrolling, by allowing users to choose whether they want to show or 
hide more detailed information as needed.
{slot=notes}

```html
<pf-accordion>
  <pf-accordion-header expanded>
    <h3>Freedom 0: To Run</h3>
  </pf-accordion-header>
  <pf-accordion-panel>
    <p>The freedom to run the program
       as you wish, for any purpose.</p>
  </pf-accordion-panel>

  ...
</pf-accordion>
```

<pf-accordion slot="feature" reveal>
  <pf-accordion-header expanded>
    <h3>Freedom 0: To Run</h3>
  </pf-accordion-header>
  <pf-accordion-panel>
    <p>The freedom to run the program as you wish, for any purpose.</p>
  </pf-accordion-panel>

  <pf-accordion-header expanded>
    <h3>Freedom 1: To Study</h3>
  </pf-accordion-header>
  <pf-accordion-panel>
    <p>The freedom to study how the program works, and change it so it does your computing as you wish. Access to the source code is a precondition for this. </p>

  </pf-accordion-panel>
  <pf-accordion-header>
    <h3>Freedom 2: To Redistribute</h3>
  </pf-accordion-header>
  <pf-accordion-panel>
    <p>The freedom to redistribute copies so you can help others</p>
  </pf-accordion-panel>

  <pf-accordion-header>
    <h3>Freedom 3: To Change</h3>
  </pf-accordion-header>
  <pf-accordion-panel>
    <p>The freedom to distribute copies of your modified versions to others. By doing this you can give the whole community a chance to benefit from your changes. Access to the source code is a precondition for this. </p>
  </pf-accordion-panel>
</pf-accordion>

<script type="module">
  import '@patternfly/elements/pf-accordion/pf-accordion.js';
</script>

<style>
  pf-accordion {
    font-size: initial;
    height: max-content;
  }
</style>
