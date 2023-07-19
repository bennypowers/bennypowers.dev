---
"reveal": pf-button
---
## PatternFly elements - `<pf-modal>` {slot=heading}

A **modal** displays important information to a user without requiring them to 
navigate to a new page.
{slot=notes}

<rh-code-block>

  ```html
  <pf-button id="trigger">Open</pf-button>
  <pf-modal trigger="trigger">
    <h2 slot="header">Modal with a header</h2>
    <p>Link button and modal through the
      <code>trigger</code> attribute,
      without JavaScript</p>
    <a slot="footer" href="https://patternflyelements.org">
      Learn more
    </a>
  </pf-modal>
  ```

</rh-code-block>

<div>
  <pf-button id="trigger">Open</pf-button>
  <pf-modal trigger="trigger" variant="small" class="unscaled">
    <h2 slot="header">Modal with a header</h2>
    <p>Link button and modal through the
      <code>trigger</code> attribute,
      without JavaScript</p>
    <a slot="footer" href="https://patternflyelements.org">
      Learn more
    </a>
  </pf-modal>
</div>


<link rel="stylesheet"
      href="centered-snippets.css"
      webc:keep>

<style>
  pf-modal::part(dialog) {
    font-size: 1rem;
    scale: 2;
  }

  pf-modal a[href^="http"] {
    color: var(--rh-color-interactive-blue-darker);
    text-decoration: underline;
    text-decoration-thickness: initial;
  }
</style>
