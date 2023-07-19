---
is: redhat-slide-closing
---

## PatternFly elements {slot=heading}
### Contributors
<div id="contributors">
  <github-contributors defer repo="patternfly/patternfly-elements"></github-contributors>
  <github-contributors defer repo="redhat-ux/red-hat-design-system" exclude-repo="patternfly/patternfly-elements"></github-contributors>
</div>

<style>
#contributors {
  --avatar-size: 128px;
  --_margin: calc(var(--avatar-size, 60px) * .3);
  margin-inline-start: var(--_margin);
  margin-block-start: var(--_margin);
}
github-contributors::part(list) {
  display: contents;
  flex-wrap: wrap;
}
github-contributors:not(:first-of-type) {
  margin-inline-start: var(-1 * var(--_margin));
}
#contributors {
  display: flex;
  flex-wrap: wrap;
}
ul {
  list-style-type: none;
  font-size: 120%;
  padding: 0 1em;
}
ul li {
  display: flex;
  align-items: center;
  gap: 8px;
}
ul li svg {
  width: 20px;
  aspect-ratio: 1;
}
@media (width <= 500px) {
#contributors {
  --avatar-size: 60px;
}
</style>

<script type="module">
import "./github-contributors.js";
document.querySelector('slidem-deck').addEventListener('change', function(event) {
  if (this.currentSlide.getAttribute('name') === 'thanks') {
    const els = this.currentSlide.shadowRoot.querySelectorAll('github-contributors')
    els.forEach(el => el.render());
  }
});
</script>
[pfe]: https://github.com/patternfly/patternfly-elements
[rhds]: https://github.com/redhat-ux/red-hat-design-system
