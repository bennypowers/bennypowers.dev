---
class: footer
reveal: ul
---

## [AreWebComponentsAThingYet.com](https://arewebcomponentsathingyet.com)

<ul class="logo-grid">
  <li><read-icon name="adobe"></read-icon></li>
  <li><read-icon name="apple"></read-icon></li>
  <li><read-icon name="github"></read-icon></li>
  <li><read-icon name="google"></read-icon></li>
  <li><read-icon name="ibm"></read-icon></li>
  <li><read-icon name="microsoft"></read-icon></li>
  <li><read-icon name="reddit"></read-icon></li>
  <li><read-icon name="salesforce"></read-icon></li>
  <li><read-icon name="sap"></read-icon></li>
  <li><read-icon name="scania"></read-icon></li>
  <li><read-icon name="spacex"></read-icon></li>
  <li><read-icon name="wordle"></read-icon></li>
  <li id="youtube"><read-icon name="youtube"></read-icon></li>
</ul>

Large Organizations and small Projects
{slot=notes}

<style>
#contents :is(h2):not([slot="header"]) {
  font-size: 2.7em;
  margin: 0;
}
.logo-grid {
  margin-block-start: 1em;
}
#youtube svg {
  fill: #f00;
}
@media (width <= 500px) {
  #contents :is(h2):not([slot="header"]) {
    line-break: anywhere;
  }
  ul {
    margin-inline: 0;
    padding-inline: 0;
  }
}
</style>
