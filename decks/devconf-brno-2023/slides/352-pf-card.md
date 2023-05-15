---
class: feature
---
## `<pf-card>` {slot=title}

A **card** is a square or rectangular container that can contain any kind of 
content. Cards symbolize units of information, and each one acts as an entry 
point for users to access more details. For example, in dashboards and catalog 
views, cards function as a preview of a detailed page. Cards may also be used in 
data displays like card views, or for positioning content on a page.
{slot=notes}

```html
<pf-card rounded>
  <h3 slot="header">PatternFly Card</h3>
  <p>
    Provides header, body, and Footer Slots.
    Attributes like <code>rounded</code> and
    <code>size</code> make variant styling easy.
  </p>
  <pf-button slot="footer">OK</pf-button>
  <pf-button danger slot="footer">Cancel</pf-button>
</pf-card>
```

<pf-card rounded slot="feature" reveal>
  <h3 slot="header">PatternFly Card</h3>
  <p>
    Provides header, body, and Footer Slots.
    Attributes like <code>rounded</code> and
    <code>size</code> make variant styling easy.
  </p>
  <pf-button slot="footer">OK</pf-button>
  <pf-button danger slot="footer">Cancel</pf-button>
</pf-card>

<script type="module">
import '@patternfly/elements/pf-card/pf-card.js';
import '@patternfly/elements/pf-button/pf-button.js';
</script>
