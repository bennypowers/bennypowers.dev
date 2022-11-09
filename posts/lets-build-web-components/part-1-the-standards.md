---
title: 'Lets Build Web Components! Part 1: The Standards'
description: A step by step guide on how to factor a modern, component-based app using web standards
datePublished: 2018-09-18
published: true
coverImage: https://thepracticaldev.s3.amazonaws.com/i/8poeepzsncvs31ero8a6.png
tags:
  - web components
  - custom elements
  - javascript
  - html
---

Component-based <abbr title="user interface">UI</abbr> is all the rage these
days. In fact it's so established that people have even started retconning
old-school jQuery widgets as "jQuery Components" ;)

When we say "Component", we're mostly referring to self-contained, reusable
bits of UI which, once written, we can insert into our apps wherever we want.
Fancy interactive buttons, specially designed pull-quotes, or the perennial
favourite card widgets are examples of the types of designs that lend
themselves well to components.

Did you know that the web has its own native component module that doesn't
require the use of any libraries? True story! You can write, publish, and reuse
single-file components that will work in
any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any
framework](https://custom-elements-everywhere.com/) (if that's your bag). Read
on to find out how!

## Overview

`Web Components` is an umbrella term that refers to a set of four browser
standards that work together to form the web's native component model.

1. [`<template>` elements](#template-elements) let you quickly reuse portions
   of <abbr title="document object model">DOM</abbr>
1. [Custom Elements](#custom-elements) connect <abbr
   title="JavaScript">JS</abbr> classes to custom <abbr title="HyperText Markup
   Language">HTML</abbr> tags
1. [Shadow DOM](#shadow-dom) hides your shame from the rest of the page
1. [JavaScript Modules](#javascript-modules) to package and publish components

Each of these standards provides one piece of the puzzle. In this introductory
post, we're going to briefly introduce each of them and explain how they help
us in practical web development.

## `<template>` Elements

<a name="template-elements"></a>

The fundamental idea of components is reusable UI. To create that, we need a
way to define a template for our component. If you're familiar with React, then
you've probably used <abbr title="JavaScript XML">JSX</abbr> before. If you're
more an Angular type, you've likely defined templates in JavaScript template
literals.

The `<template>` element lets us define snippets of HTML which aren't added to
the document until cloned by JavaScript. The browser only needs to parse that
HTML once (e.g. when the document loads), and can then clone it cheaply
whenever asked to.

Here's a (really contrived) example of the template element in action:

```html
<template id="dialog-template">
  <dialog>
    <p></p>
    <button>⚓️ All Ashore!</button>
  </dialog>
</template>

<label>
  Type a <abbr title="message"> 💌</abbr>
  <input id="input"/>
</label>

<button id="clone-it"><abbr title="Go!">🦑 Ahoy!</abbr></button>

<script>
  document.getElementById('clone-it').onclick = () => superAlert(input.value);

  function superAlert(message) {
    // get a reference to the template
    const template = document.getElementById('dialog-template');
    // clone or "stamp" the template's contents
    const clone = template.content.cloneNode(true);

    // Make any changes to the stamped content
    const diag = clone.firstElementChild;

    // <dialog> element polyfill
    dialogPolyfill.registerDialog(diag);

    diag.firstElementChild.textContent = message;
    diag.lastElementChild.onclick = function closeModal() {
      diag.close();
      diag.remove();
    }
    document.body.appendChild(diag)
    diag.showModal();
  }
</script>
```

{% glitch 'wistful-ant', 'app' %}

Using `<template>` elements is easy and performant. I put together a silly
little [benchmark][template-benchmark] that builds a simple table three ways:
by cloning a template element, by directly using DOM <abbr title="Application
Programmer Interface">API</abbr>s, and by setting `innerHTML`. Cloning template
elements is the fastest, DOM APIs are a little slower, and `innerHTML` is
slowest by far.

[![Template Elements: 55877 Operations / second. DOM APIs: 51666 Operations /
second. Template Literals: 44102 Operations /
second][benchmark-screenshot]][benchmark-results]

So the `<template>` element lets us parse HTML once and reuse it as many times
as we want. Exactly like what we need for our reusable components!

Read more about the [`<template>` element][mdn-template] and it's [DOM
API][mdn-template-api] at <abbr title="Mozilla Developer Network">MDN</abbr>.

## Custom Elements

The second standard we're going to take a look at is called custom elements. It
does exactly what it says on the box: it lets you define your own custom HTML
tags. Now you don't have to settle for just plain old `<div>` and `<span>`, but
you can mark up your pages with `<super-div>` and `<wicked-span>` as well.

Custom Elements work just like built-in elements; add them your document, give
them child elements, use regular DOM APIs on them, etc. You can use custom
elements everywhere you use regular elements, [including in popular web
frameworks](https://custom-elements-everywhere.com)

All custom element tag names must contain a dash, to differentiate them from
built in elements. This also helps to avoid name conflicts when you want to use
`<bobs-input>` and `<sallys-input>` in the same app. As well, Custom elements
can have their own custom attributes, DOM properties, methods and behaviours.

An example of how you might use a custom element:

```html
<section>
  <p>Twinkle, twinkle, little <super-span animation="shine">star</super-span>.</p>
  <awesome-button exuberant>Shine it!</awesome-button>
</section>
```

Custom elements are defined as [JavaScript classes][js-classes], and registered
on the `window.customElements` object via its `define` method, which has two
parameters: a string to define the element's name, and a JavaScript class to
define its behaviour.

This example takes a boring old `<span>` and gives it emoji super-powers! Give
it a try.

```js
customElements.define('super-span', class SuperSpan extends HTMLElement {
  /**
   * `connectedCallback` is a custom-element lifecycle callback
   * which fires whenever the element is added to the document
   */
  connectedCallback() {
    this.addEventListener('click', this.beAwesome.bind(this))
    this.style.display = 'inline-block';
    this.setAttribute('aria-label', this.innerText);
    switch (this.innerText) {
      case 'star': this.innerText = '⭐️';
    }
  }

  /**
   * You can define your own methods on your elements.
   * @param  {Event} event
   * @return {Animation}
   */
  beAwesome(event) {
    let keyframes = [];
    let options = {duration: 300, iterations: 5, easing: 'ease-in-out'}
    switch (this.getAttribute('animation')) {
      case 'shine': keyframes = [
        {opacity: 1.0, blur: '0px', transform: 'rotate(0deg)'},
        {opacity: 0.7, blur: '2px', transform: 'rotate(360deg)'},
        {opacity: 1.0, blur: '0px', transform: 'rotate(0deg)'},
      ];
    }
    return this.animate(keyframes, options)
  }
});
```

{% glitch 'ivory-fan', 'app' %}

Custom Elements have built-in features like lifecycle callbacks and observed
attributes. We'll cover those in a later post. Spoiler alert: You can read [all
about custom elements on MDN][mdn-custom-elements].

## Shadow DOM

What stalks the document tree, hiding in the shadows, the dark places where innocent nodes fear to tread?

*Dada dada dada dada! Shadow DOM!*

<blockquote>I am darkness. I am the night. I am Shadow DOM!</blockquote>

![Batman lurking in the shadows](https://thepracticaldev.s3.amazonaws.com/i/gq600wk8fo1vg93854mf.png)

Although "Shadow DOM" might sound exotic, it turns out you've been using it for years. Every time you've used a `<video>` element with controls, or an `<input>` element with a datalist, or others like the date picker element, you've been using Shadow DOM.

Shadow DOM is simply an HTML document fragment that is visible to the user while at the same time isolated from the rest of the document. Similarly to how iframes separate one document from another embedded document, shadow roots separate a portion of a document from the main document.

For example, the controls in a video element are actually a separate DOM tree which lives, batman-like, in the shadows of your page. Global styles don't affect the video controls, and the same is true vice-versa.

<figure>
  ![Screenshot of Firefox developer tools highlighting the use of a shadow root on wego.com](https://thepracticaldev.s3.amazonaws.com/i/zue201pl8hk31s6go5al.png)
  <figcaption>An example of Shadow DOM being used on wego.com to isolate DOM from the rest of the page</figcaption>
</figure>

Why is isolating DOM a good thing? When working on web apps of any non-trivial size, <abbr title="Cascading Style Sheets">CSS</abbr> rules and selectors can quickly get out of hand. You might write the perfect CSS for a single section of your page, only to have your styles overruled by your teammate further down the cascade. Even worse, your new additions to the app might break existing content without anyone noticing!

Many solutions to this problem have been developed over time, from strict naming conventions to 'CSS-in-JS', but none of them are particularly satisfying. With shadow DOM, we have a comprehensive solution built in to the browser.

**Shadow DOM isolates DOM nodes**, letting you style your components freely, without worrying that other portions of the app might clobber them. Instead of reaching for arcane class names or stuffing everything into the `style` attribute, you can style your components in a simple, straightforward way:

```html
<template id="component-template">
  <style>
    :host {
      display: block;
    }

    /* These styles apply only to button Elements
     * within the shadow root of this component */
    button {
      background: rebeccapurple;
      color: inherit;
      font-size: inherit;
      padding: 10px;
      border-radius: 4px;
      /* CSS Custom Properties can pierce the shadow boundary,
       * allowing users to style specific parts of components */
      border: 1px solid var(--component-border-color, ivory);
      width: 100%;
    }

  </style>

  <!-- This ID is local to the shadow-root. -->
  <!-- No need to worry that another #button exists. -->
  <button id="button">I'm an awesome button!</button>
</template>

<style>
  /* These styles affect the entire document, but not any shadow-roots inside of it */
  button {
    background: cornflowerblue;
    color: white;
    padding: 10px;
    border: none;
    margin-top: 20px;
  }

  /* Custom Elements can be styled just like normal elements.
   * These styles will be applied to the element's :host */
  button,
  awesome-button {
    width: 280px;
    font-size: inherit;
  }
</style>

<awesome-button></awesome-button>

<button id="button">I'm an OK button!</button>

<section id="display">
  <abbr title="click">🖱</abbr> a <abbr title="button">🔲</abbr>
</section>
```

{% glitch 'marked-piper' %}

Shadow DOM is the secret sauce in web components. It's what makes them self-contained. It's what gives us the confidence to drop them into a page without worrying about breaking other parts of the app.

And starting with Firefox 63, it's available natively on all good browsers.

Read more about [Shadow DOM on MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)

With these three standards: Template, Custom Elements, and Shadow DOM, we have everything we need to write rich component UIs that run directly in the browser without needing any special tooling or build steps. The fourth standard, JavaScript Modules, enables us to factor complex apps composed of custom elements and publish our components for others to use.

## JavaScript Modules
When we use the word *module*, what we mean is a freestanding piece of software which contains its own scope. In other words, if I define a variable `foo` in some module, I can only use that variable inside that module. If I want to access `foo` in some other module, I'll need to explicitly export it first.

Developers have been finding ways to write modular JavaScript for some time now, but it's only been fairly recently (since 2015 in the specs, and for the last year or so in practice) that JavaScript has had its own module system.

```js
import { foo } from './foo.js'

const bar = 'bar'

export const baz = foo(bar)
```

There's [a](https://dev.to/bennypowers/you-should-be-using-esm-kn3) [lot](https://dev.to/twhite/es6-modules-2bi) [to](https://dev.to/papaponmx/my-impressions-after-trying-to-use-es-modules-in-2018---3mga) [say](https://dev.to/omensah/-building-modular-javascript-application-with-es6-module-system--3h88) about modules, but for our purposes, it's enough that we can use them to write and publish web components.

Here's a simple example to whet your appetite.

```js
// super-span.js

const options = {duration: 300, iterations: 5, easing: 'ease-in-out'}
const keyframes = [
  {opacity: 1.0, blur: '0px', transform: 'rotate(0deg)'},
  {opacity: 0.7, blur: '2px', transform: 'rotate(360deg)'},
  {opacity: 1.0, blur: '0px', transform: 'rotate(0deg)'},
]

const template = document.createElement('template')
template.innerHTML = `
  <style>
    span {
      display: inline-block;
      font-weight: var(--super-font-weight, bolder);
    }
  </style>
  <span><slot></slot></span>
  <abbr title="click or mouse over">🖱</abbr>
`;

customElements.define('super-span', class SuperSpan extends HTMLElement {

  $(selector) {
    return this.shadowRoot && this.shadowRoot.querySelector(selector)
  }

  constructor() {
    super()
    this.shine = this.shine.bind(this)
    const root = this.attachShadow({mode: 'open'})
          root.appendChild(template.content.cloneNode(true))
    this.addEventListener('click', this.shine)
    this.addEventListener('mouseover', this.shine)
  }

  connectedCallback() {
    const slot = this.$('slot')
    const [node] = slot.assignedNodes()
    this.setAttribute('aria-label', node.textContent)
    node.textContent = '⭐️'
  }

  shine(event) {
    this.$('span').animate(keyframes, options)
  }
});
```

And then in our app's HTML:

```html
<script type="module" src="./super-span.js"></script>
<super-span>star</super-span>
```

{% glitch 'truthful-plow' %}

And this, my friends, is the coin-drop moment when you realize how awesome web components can be.

Now you can easily import pre-made custom elements with awesome behaviour and semantics right into your documents, without any build step.

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>Be Excellent to Each Other</title>
    <script type="module" src="//unpkg.com/@power-elements/lazy-image/lazy-image.js?module"></script>
    <script type="module" src="//unpkg.com/@granite-elements/granite-alert/granite-alert.js?module"></script>
    <script type="module" src="//unpkg.com/@material/mwc-button/mwc-button.js?module"></script>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <header>
      <h1>Cross-platform, Framework-Agnostic, Reusable Components</h1>
    </header>
    <main>

      <granite-alert id="alert" level="warning" hide>
        <lazy-image role="presentation"
            src="//placekitten.com/1080/720"
            placeholder="//web-components-resources.appspot.com/static/logo.svg"
            fade
        ></lazy-image>
      </granite-alert>

      <mwc-button id="button" raised>🚀 Launch</mwc-button>

      <script>
        const alert = document.getElementById('alert')
        const button = document.getElementById('button')
        const message = document.getElementById('message')
        button.onclick = () => {
          alert.hide = !alert.hide;
          button.textContent = alert.hide ? '🚀 Launch' : '☠️ Close'
        }
      </script>
    </main>
  </body>
</html>
```

{% glitch 'road-physician', 'app' %}

## Conclusion

Web components standards let us factor self-contained, reusable UI that runs directly in the browser without cumbersome build steps. These components can then be used anywhere you use regular elements: in plain HTML, or within your app's framework-driven templates.

In our next post, God-willing, we'll learn how the [webcomponentsjs polyfills](https://www.webcomponents.org/polyfills) let us design components and compose apps even for browsers that don't natively support them.

😀 Thanks for reading! 😁

Check out the next article in the series

[Part 2: The Polyfills](../part-2-the-polyfills/)

Would you like a one-on-one mentoring session on any of the topics covered here? [![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Errata
- A previous version of this article showed an example of accessing light DOM attributes and children in the `constructor`. This kind of work should be deferred until `connectedCallback`.
- Since this post was originally published, [Microsoft has begun development on the web components standards in Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/customelements/). Party time!


[mdn-template]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
[mdn-template-api]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
[mdn-custom-elements]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
[template-benchmark]: https://jsperf.com/template-element-vs-dom-api-vs-template-literals/1
[benchmark-screenshot]: https://thepracticaldev.s3.amazonaws.com/i/euddifi8eb2vbs96fxcj.png
[benchmark-results]: https://jsperf.com/template-element-vs-dom-api-vs-template-literals/1
[js-classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/class
