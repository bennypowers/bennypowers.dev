---
reveal: pf-card
---
## PatternFly elements - `<pf-card>` {slot=heading}

A **card** is a square or rectangular container that can contain any kind of 
content. Cards symbolize units of information, and each one acts as an entry 
point for users to access more details. For example, in dashboards and catalog 
views, cards function as a preview of a detailed page. Cards may also be used in 
data displays like card views, or for positioning content on a page.
{slot=notes}

<rh-code-block>

```html
<pf-card rounded>
  <h3 slot="header">PatternFly Card</h3>
  <p>Has slots for header, body, and footer,
    and attributes (<code>rounded</code>,
    <code>size</code>) for variation.</p>
  <pf-button slot="footer">OK</pf-button>
  <pf-button slot="footer" danger>
    Cancel
  </pf-button>
</pf-card>
```

</rh-code-block>

<pf-card rounded class="unscaled">
  <h3 slot="header">PatternFly Card</h3>
  <p>Has slots for header, body, and footer,
    and attributes (<code>rounded</code>,
    <code>size</code>) for variation.</p>
  <pf-button slot="footer">OK</pf-button>
  <pf-button slot="footer" danger>
    Cancel
  </pf-button>
</pf-card>

<link rel="stylesheet"
      href="unscaled-components.css"
      webc:keep>

<link rel="stylesheet"
      href="centered-snippets.css"
      webc:keep>
