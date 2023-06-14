## Special Thanks {slot=title}

### Contributors
<div id="contributors">
  <github-contributors defer repo="patternfly/patternfly-elements"></github-contributors>
  <github-contributors defer repo="redhat-ux/red-hat-design-system" exclude-repo="patternfly/patternfly-elements"></github-contributors>
</div>

<small>Icon Credits (CC BY 3.0): Yuval Galanti, Smashicons, Prime Icons</small>

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
