## What are web components {slot=heading}

(large scale - compare to native ui frameworks) {slot=notes}

Web components are the **web's native component model**. They are part of the 
HTML and DOM specification and are implemented in all major browsers.

<div id="spec-logos">
  <img alt="w3c logotype"
       src="https://www.w3.org/assets/logos/w3c/w3c-no-bars.svg">
  <img alt="whatwg logo: a circled green question mark"
       src="https://resources.whatwg.org/logo.svg">
</div>

<div reveal style="height: 1px;overflow:visible;">
  <img id="screenshot"
       alt="screenshot of custom elements spec on whatwg website"
       src="images/spec-ce.png">
</div>

<style>
#spec-logos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-inline: auto;
  place-items: center;
}
#spec-logos img {
  height: var(--rh-size-icon-09);
  display: block;
}
#screenshot {
  position: absolute;
  inset: 1em;
}
</style>
