---
class: feature
---

## `<pf-modal>` {slot=title}

A **modal** displays important information to a user without requiring them to 
navigate to a new page.
{slot=notes}

```html
<pf-button id="usage-trigger">Open modal</pf-button>
<pf-modal variant="small" trigger="usage-trigger">
  <h2 slot="header">Modal with a header</h2>
  <p>Lorem ipsum dolor sit amet,
    <a href="#foo">consectetur adipisicing</a> elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
    Duis aute irure dolor in reprehenderit in voluptate velit esse.
    Excepteur sint occaecat cupidatat non proident,
    sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  <a slot="footer" href="#bar">Learn more</a>
</pf-modal>
```

<pf-modal variant="small" trigger="usage-trigger">
  <h2 slot="header">Modal with a header</h2>
  <p>Lorem ipsum dolor sit amet,
    <a href="#foo">consectetur adipisicing</a> elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
    Duis aute irure dolor in reprehenderit in voluptate velit esse.
    Excepteur sint occaecat cupidatat non proident,
    sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  <a slot="footer" href="#bar">Learn more</a>
</pf-modal>
<pf-button id="usage-trigger">Open modal</pf-button>

<script type="module">
  import '@patternfly/elements/pf-button/pf-button.js';
  import '@patternfly/elements/pf-modal/pf-modal.js';
</script>

<style>
  .feature #contents { grid-template: 1fr / 1fr; }
  #usage-trigger { place-self: center; }
</style>
