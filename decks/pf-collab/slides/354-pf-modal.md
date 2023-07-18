## `<pf-modal>` {slot=heading}

A **modal** displays important information to a user without requiring them to 
navigate to a new page.
{slot=notes}

<rh-code-block>

  ```html
  <pf-button id="usage-trigger">Open modal</pf-button>
  <pf-modal variant="small" trigger="usage-trigger">
    <h2 slot="header">Modal with a header</h2>
    <p>Without build tooling or additional JavaScript,
       PatternFly Modal and PatternFly button link through
       the <code>trigger</code> attribute.</p>
    <a slot="footer"
       href="https://patternflyelements.org">Learn more</a>
  </pf-modal>
  ```

</rh-code-block>

<pf-modal variant="small" trigger="usage-trigger" class="unscaled">
  <h2 slot="header">Modal with a header</h2>
  <p>Without build tooling or additional JavaScript,
     PatternFly Modal and PatternFly button link through
     the <code>trigger</code> attribute.</p>
  <a slot="footer"
     href="https://patternflyelements.org">Learn more</a>
</pf-modal>
<pf-button id="usage-trigger">Open modal</pf-button>

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
