---
title: Form-Associated Custom Elements
published: false
description: |
  Form-Associated Custom Elements are a new web standard by which to build
  custom interactive form controls like buttons, inputs, checkboxes, etc. Get to 
  know the new spec and build a simple checkbox component in this short 
  tutorial.
datePublished: 2022-11-15
tags:
  - web components
  - face
  - custom elements
  - javascript
  - lit
---

Form-Associated Custom Elements are a new web standard by which to build custom
interactive form controls like buttons, inputs, checkboxes, etc. They present a
path forward for design-systems and other custom element authors to more deeply
integrate with the web platform. In this post, we'll build a simple <abbr
title="Form-Associated custom element">FACE</abbr> to get a feel for the APIs.

<details open><summary>But before we get to the code, some history:</summary>

## How we Got Here

The web components v1 standard originally defined two kinds of custom elements.
The most popular kind is called and *[autonomous custom element][ace]*, and
it's what most people think about when they think of web components. The other
kind is called a *[customized built-in element][cbie]*, and they look like
this:

```js
class XButton extends HTMLButtonElement {
  static is = 'x-button';
}
customElements.define(XButton.is, XButton, {
  extends 'button',
});
```

You use <abbr title="customized-built-in-element">CBIE</abbr>s like this:

```html
<button is="x-button">I'm an XButton</button>
```

Notice the big differences here: `XButton` the customized built-in extends
`HTMLButtonElement`, not `HTMLElement`, and when you register it, you have to
pass both the custom element name `x-button` as well as the `localName` of the
`button` element it extends. When using it in HTML, the `localName` of the
element is `button` and the `is` attribute determines which subclass of
`HTMLButtonElement` to upgrade with.

The chief advantage of customized built-ins was that they came with all the
original features of their base elements, well, built-in. So a custom-element
author wouldn't need to implement a bunch of stuff to make their custom
textfield go, rather they could just extend the existing `HTMLInputElement`
class and get all the necessary and expected functionality (especially crucial
accessibility features) for free. Typical <abbr title="object-oriented
programming">OOP</abbr> stuff. So if customized built-ins are so great, how
come this post isn't about them and how come we rarely see them?

Unfortunately, although customized built-ins remain a part of the spec, **you
should not build them**. The reason for this is discouraging: despite the
spec's ratification, Apple's WebKit team [stated][no-cbie] that they would
decline to implement customized built-ins. Since WebKit enjoys an [artificial
monopoly][open-web-advocacy] on iOS devices, the WebKit team's decision has an
outsized effect on the industry. Think "US Electoral College", but for web
browsers. Their decision not to implement makes customized built-ins a
non-starter. Some prominent web developers (most notably Andrea Giammarchi)
have advocated permanently adopting a polyfill, but the broader web components
community has generally acquiesced to WebKit's decision.

Which is how FACE came to be, it's the alternative to <abbr
title="customized-built-in-element">CBIE</abbr>s championed by WebKit.

</details>

## The Workarounds

Before FACE, page authors using custom elements had two options to submit forms 
with data from their web components:

1. The "decorator pattern" - slotting native controls into autonomous custom elements
2. Using JavaScript to manually submit form data

Each of these had their pros and cons.

### The Decorator Pattern

The most versatile workaround for autonomous custom controls involves slotting 
native controls into the custom element.

```html
<x-checkbox><input type="checkbox"></x-checkbox>
```

The advantages to this approach include `<noscript>` support and hassle-free 
form participation. The disadvantages include HTML noise and awkward styling due 
to the current limitations of `::slotted()`.

### Manually Submitting Forms

Developers working on <abbr title="single page applications">SPAs</abbr> might 
opt instead to put their native inputs in the shadow DOM and use javascript to 
submit the form data to a JSON API. Here's a simple example of how that might 
work:

```js
form.addEventListener('submit', function(event) {
  event.preventDefault();
  const body = JSON.stringify(somehowCollectFormValuesFromCustomControls());
  const { action, method = 'POST' } = form;
  fetch(action, { method, body });
})
```
build-a-face/?#how-we-got-herebuild-a-face/?#how-we-got-here
Given the right abstractions this approach could be quite productive for 
developers, but ties the controls to javascript.

## Creating a FACE

Form-Associated Custom Elements solves one of the problems that `is` would have
solved, namely, allowing your web component to participate in native web forms.

```js
class XCheckbox extends HTMLElement {
  static formAssociated = true;
}

customElements.define('x-checkbox', XCheckbox);
```

So what does this give us? Well, right off the bat, that one static class
boolean adds a number of form-related behaviours to our otherwise plain
element. The `name`, `form`, and `disabled` attributes now work the same as
native `<input>` elements, and the presence of the `readonly` attribute will 
prevent the browser from trying to validate your field, although you're still 
responsible to make the control *actually* non-editable. Naming your FACE and 
specifying a form (by child composition or via `form` attr) adds it to the 
form's [`HTMLFormControlsCollection`][HTMLFormControlsCollection], as well, if 
the element or it's containing `<formset>` has the `disabled` attribute, it will 
gain the CSS state `:disabled`.

```html
<form>
  <fieldset disabled>
    <label for="xcheck">Check?</label>
    <x-checkbox id="xcheck" name="checkit" value="checkit"></x-checkbox>
  </fieldset>
</form>
```

In the above example, our custom checkbox is disabled on account of its 
containing fieldset, and the form submits with its value on `checkit`. Removing 
`disabled` from the fieldset also unsets it from the element, which you can see 
in the example below:

<form id="form">
  <fieldset id="set" disabled>
    <legend>This fieldset controls <code>x-checkbox</code></legend>
    <label for="xcheck">Check?</label>
    <x-checkbox id="xcheck" name="checkit"></x-checkbox>
  </fieldset>
</form>

<fieldset form="form">
  <legend>Submit to print form state</legend>
  <input id="toggle"
         type="checkbox"
         checked
         onchange="set.disabled=!set.disabled">
  <label for="toggle">Toggle fieldset's <code>disabled</code> state</label>
  <button type="submit" form="form">Submit</button>
</fieldset>
<output name="state" form="form">Awaiting submission...</output>

<script type="module">
customElements.define('x-checkbox', class XCheckbox extends HTMLElement {
  static formAssociated = true;
});

form.addEventListener('submit', function(event) {
  event.preventDefault();
  this.elements.state.textContent =
    `xcheck is ${xcheck.matches(':disabled') ? 'disabled' : 'enabled'}`;
});
</script>

All of that comes for free, even before implementing any actual custom control 
behaviour. FACE comes along with another new standard, 
[`ElementInternals`][ElementInternals], which provides a standard place to 
implement things like form control validation and accessibility.

## ElementInternals

`HTMLElement` get a new standard method called `attachInternals()` which returns 
an `ElementInternals` object. This method may only be called on autonomous 
custom elements and will throw if called on built-ins, customized or otherwise.

[ace]: https://html.spec.whatwg.org/multipage/custom-elements.html#autonomous-custom-element
[cbie]: https://html.spec.whatwg.org/multipage/custom-elements.html#customized-built-in-element
[no-cbie]: https://b.webkit.org/show_bug.cgi?id=182671
[open-web-advocacy]: https://open-web-advocacy.org/
[HTMLFormControlsCollection]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement
[ElementInternals]: https://html.spec.whatwg.org/multipage/custom-elements.html#the-elementinternals-interface
