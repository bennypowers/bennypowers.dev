---
title: 'Lets Build Web Components! Part 2: The Polyfills'
published: true
date: 2018-09-29
description: Web Components are the future, but with a little care and some helpful polyfills, they can be the present as well.
cover_image: https://thepracticaldev.s3.amazonaws.com/i/1pbf5o2wj64jhwlrc2m5.png
tags:
  - web components
  - custom elements
  - javascript
  - html
  - Let's Build Web Components!
  - polyfills
---

Component-based UI is all the rage these days. Did you know that the web has its own native component module that doesn't require the use of any libraries? True story! You can write, publish, and reuse single-file components that will work in any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any framework](https://custom-elements-everywhere.com/) (if that's your bag).

In our [last post](../part-1-the-standards/), we learned about the four web standards that let us write web components: `<template>`, custom elements, shadow DOM, and JavaScript modules.

Today, we'll learn a little bit about the [webcomponentsjs polyfills](https://github.com/webcomponents/webcomponentsjs) which let us write web component based apps that run on browsers which don't support the specs.

- [Overview](#overview)
- [Loading the Polyfills](#loading-the-polyfills)
    - [Advanced Loading Scenarios](#advanced-loading-scenarios)
    - [Asynchronous Loading](#asynchronous-loading)
- [Writing Custom Elements that Work with the ShadyCSS Polyfill](#writing-custom-elements-that-work-with-the-polyfills)
    - [ShadyCSS tl;dr](#shadycss-tl-dr)
- [Custom Elements Polyfill](#custom-elements-polyfill)
    - [Supporting IE11](#supporting-ie11)

## Overview

Web components are truly awesome. And if you're my favourite brand of nerd, the promise of cross-browser, reusable, interoperable components is heady stuff. It's a no-brainer that web component-based libraries and apps are going to quickly grow in popularity, since as of late October of 2018, web components will be natively supported in the latest versions of Chrome, Firefox and Safari. Even Microsoft has begun work on their implementation in Edge. Sweet!

But web developers who have been in this joint for longer than a minute know that it's not always that simple. Sometimes it feels like the cooler the web platform feature (I'm looking at you, [scroll-snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap)!), the less likely it is to be widely supported.

But fear not, friends! You can dive in to the web components world today without fear of leaving users on older browsers behind. The good people at Google's [web components team](https://www.webcomponents.org/) had you in mind when they created the [webcomponentsjs polyfills](https://github.com/webcomponents/webcomponentsjs), which let you target your apps to IE11, which I'm sure is the reason you wake up in the morning. The polyfills will also work on older versions of Chrome and Firefox, and on Microsoft Edge, until they ~~wake up and implement the two [most popular tickets on their uservoice board](https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/filters/top)~~ finish their implementation.

So don't just sit there, read on! We'll learn together how to load the polyfills, how to write custom elements that leverage them correctly, and how to avoid known issues and pitfalls with the polyfills.

## Loading the Polyfills
For most users, the easiest thing to do is pop a script tag sourcing the `webcomponents-loader.js` script into your page's `head`, before loading any component files. This script checks the users browser's <abbr title="user agent">UA</abbr> string, and only loads the polyfill or set of polyfills that are needed.

```html
<head>
  <!-- Load the polyfills first -->
  <script src="https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
  <!-- Then afterwards, load components -->
  <script type="module" src="./superlative-input.js"></script>
</head>
```

You can load the scripts via CDN as we've done above, or you can bundle them with the rest of your app code by installing to your project:

```bash
npm install --save @webcomponents/webcomponentsjs
```

```html
<head>
  <!-- ... -->
  <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>;
</head>

<body>
  <script type="module">
    import './superlative-input.js'
    const template = html`<superlative-input label="🥙"></superlative-input>`;
    // ...
  </script>
</body>
```

<aside>By the way, I just discovered that there's a falafel emoji 🥙, which I think technically brings the world one step closer to perfection.</aside>

### Advanced Loading Scenarios
You can also load specific polyfills individually if you know exactly what you need:

```html
<!-- Load all polyfills, including template, Promise, etc. -->
<!-- Useful when supporting IE11 -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>

<!-- Load only the Shadow-DOM and Custom Elements polyfills -->
<!-- Useful to support Firefox <63 -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs/entrypoints/webcomponents-sd-ce-index.js"></script>

<!-- Load only the Shadow-DOM polyfills -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs/entrypoints/webcomponents-sd-index.js"></script>

<!-- Load only the Custom Elements polyfills -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs/entrypoints/webcomponents-ce-index.js"></script>
```

You might choose to bite the bullet and load the bundle or `sd-ce` polyfills in all cases, which would save your users a round-trip to the server. This is a popular choice in production environments where reducing the number of requests is important. In most simple cases, you'll probably just want to use the `webcomponents-loader.js` script.

The full bundle adds **94kb** to your critical loading path, whereas the loader only adds **5kb**. You should balance the needs of the likely minority of your users on old browsers with the convenience of the likely majority on evergreen browsers.

### Asynchronous Loading
In most cases, you'll want to synchronously load the `webcomponents-loader.js` script at the top of your `head`. But there will be times you'll want to load it asynchronously. For example: if your app implements a [static app-shell](https://google-developer-training.gitbooks.io/progressive-web-apps-ilt-concepts/content/docs/introduction-to-progressive-web-app-architectures.html#instant) to give users the illusion of performance, you'll want that static HTML and CSS to load as quickly as possible, which means eliminating render-blocking resources. In those cases, you'll need to use the `window.WebComponents.waitFor` method to ensure your components load after the polyfills. Here's a ~~gratuitously lifted~~ slightly-modified example from the `webcomponentsjs` README:

```html
<!-- Note that because of the "defer" attr, "loader" will load these async -->
<script defer src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>

<!-- Load a custom element definitions in `waitFor` and return a promise -->
<!-- Note that all modules are deferred -->
<script type="module">
  WebComponents.waitFor(() =>
    // At this point we are guaranteed that all required polyfills have
    // loaded, and can use web components API's.
    // The standard pattern is to load element definitions that call
    // `customElements.define` here.
    // Note: returning the import's promise causes the custom elements
    // polyfill to wait until all definitions are loaded and then upgrade
    // the document in one batch, for better performance.
    Promise.all([
      import('./my-element.js'),
      import('/node_modules/bob-elements/bobs-input.js'),
      import('https://unpkg.com/@power-elements/lazy-image/lazy-image.js?module'),
    ])
  );
</script>

<!-- Use the custom elements -->
<my-element>
  <bobs-input label="Paste image url" onchange="e => lazy.src = e.target.value"></bobs-input>
  <lazy-image id="lazy"></lazy-image>
</my-element>
```

Or an example more typical of a static-app-shell pattern:
```html
<head>
  <script defer src="https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
  <style>
    /* critical static-app-shell styles here */
  </style>
</head>
<body>
  <script type="module">
    // app-shell.js in turn imports its own dependencies
    WebComponents.waitFor(() => import('./app-shell.js'))
  </script>
  <app-shell loading>
    <header id="static-header">
      <span id="static-hamburger"></span>
      <span id="static-user"></span>
    </header>
    <main>
      <div id="static-spinner"></div>
    </main>
    <footer id="static-footer"></footer>
  </app-shell>
</body>
```

## Writing Custom Elements that Work with the Polyfills

If you're using a web component library like [Polymer](https://github.com/polymer/polymer), [LitElement](https://github.com/polymer/lit-element), or [hybrids](https://github.com/hybridsjs/hybrids) (among others) to write your components (something we'll cover in a later post), your components will work with the polyfills out-of-the-box. Those libraries are  [specifically](https://github.com/Polymer/polymer/search?q=shady+extension%3Ajs&unscoped_q=shady+extension%3Ajs) [written](https://github.com/Polymer/lit-element/blob/eb481ecc925bc4535e4101112c65b71ff7f7d450/src/lib/updating-element.ts#L387) to [use](https://github.com/hybridsjs/hybrids/search?q=shady&unscoped_q=shady) the polyfills. Your job is done. Have a beer.

But if you're writing your components without using a library (first of all, good for you), you'll need to jump through a few hoops to make sure that your components render correctly for as many users as possible.

Eagle-eyed readers may have noticed a few tricky lines of JavaScript peppered into one of the examples that we used in the last post:

```js
const template = document.createElement('template')
template.innerHTML = /*...*/

// Let's give the polyfill a leg-up
window.ShadyCSS &&
window.ShadyCSS.prepareTemplate(template, 'awesome-button')

customElements.define('awesome-button', class AwesomeButton extends HTMLElement {
  constructor() {
    super()
    this.onclick = () => report('Clicked on Shadow DOM')
  }

  connectedCallback() {
    // Let's give the polyfill a leg-up
    window.ShadyCSS && window.ShadyCSS.styleElement(this)
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(template.content.cloneNode(true))
    }
  }
})
```

See that `ShadyCSS` reference? That's the part of the polyfills which emulates the style-scoping of shadow DOM in browsers which don't support it. In order for your styles to be scoped properly, there are a few rules to follow:

### ShadyCSS Rules:
1. Styles should be defined in a `<style>` element which is a direct child of a `<template>` element.
1. That `<style>` tag should be the only one in that template.
1. Before your element attaches, associate its template with it's tag name with `ShadyCSS.prepareTemplate(templateElement, tagName)`
1. After your custom element attaches to the document, but before the shadow root is created, call `ShadyCSS.styleElement` on your custom element to calculate its styles.

`prepareTemplate` parses the rules in your style tag into an abstract syntax tree, and then prepends generated parent selectors to them to simulate scoping.
```css
button {/*...*/}
```
becomes...
```css
.style-scope .awesome-button button {/*..*/}
```
`styleElement` applies the scoping classes to your element and it's "shady" children.
```html
<awesome-button>
  #shadow-root
  <button></button>
</awesome-button>
```
becomes...
```html
<awesome-button>
  <button class="style-scope awesome-button"></button>
</awesome-button>
```

ShadyCSS will also shim CSS Custom Properties (`var(--foo)`) if the browser doesn't support them.

### Dynamic Styles
Because of the way the ShadyCSS polyfill works, web component authors that need to support older browsers are advised not to use dynamically generated CSS such as:

```js
const getTemplate = ({disabled}) => `
  <style>
    button {
      background-color: ${disabled ? 'grey' : 'white'};
    }
  </style>
`

class AwesomeButton extends HTMLElement {
  set disabled(disabled) {
    this.render()
  }

  connectedCallback() {
    this.attachShadow({mode: 'open'})
    this.render()
  }

  render() {
    this.shadowRoot.innerHTML = getTemplate(this.disabled)
  }
}
```

Instead of that example (which is poorly conceived for many different reasons, not just ShadyCSS compatibility), use CSS Custom Properties, and whenever a dynamic update occurs, use `ShadyCSS.styleSubTree` or `ShadyCSS.styleDocument`:

```js
const template = document.createElement('template')
template.innerHTML = `
  <style>
    button {
      background-color: var(--awesome-button-background, white);
    }
  </style>
  <button></button>
`;

class AwesomeButton extends HTMLElement {
  static get observedAttributes() {
    return ['disabled']
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'})
      this.shadowRoot.appendChild(template.content.cloneNode(true))
    }
  }

  attributesChangedCallback(name, oldVal, newVal) {
    name === 'disabled' &&
    ShadyCSS &&
    ShadyCSS.styleDocument({
      '--awesome-button-background' : newVal ? 'grey' : 'white',
    });
  }
}
```

For the curious, the way to do this natively, i.e. if the polyfills are not involved, is to just style the document:

```js
// No Polyfill
document.documentElement.style
  .setProperty('--awesome-button-background', newVal ? 'grey' : 'white');
```

Those are contrived examples. In the real world you're more likely to solve the problem entirely with CSS like:

```css
:host { background: white; }
:host([disabled]) { background: grey; }
```

But if you wanted to, say, rotate a hue based on touch events or transform an element based on websocket updates, CSS Custom Properties are the way to go.

ShadyCSS provides some other features like a shim for the now-deprecated `@apply` CSS syntax, but we're not going to cover them because that spec is dead in the water.

There are also some [known limitations to the ShadyCSS polyfill](https://github.com/webcomponents/shadycss#limitations). Spoilers:
- Since ShadyCSS removes all `<slot>` elements, you can't select them directly, so you have to use some context wrapper like `.context ::slotted(*)`.
- Document styles can leak down into your shady trees, since the polyfill only simulates encapsulation.

For the low-down and dirty on known-limitations, see the [README](https://github.com/webcomponents/shadycss#limitations).

### ShadyCSS tl;dr:
So basically, your elements will work as intended even on older browsers and Edge as long as you
- Define your element's styles in it's `<template>` element;
- Factor your element's shadow slots with the polyfill in mind;
Make the appropriate incantations in your element's `connectedCallback`; And
- Dynamically update CSS Custom Properties with `ShadyCSS.styleDocument` or `ShadyCSS.styleSubTree`, or avoid the problem by using some other CSS-based solution.

## Custom Elements Polyfill

The [custom elements polyfill](https://github.com/webcomponents/custom-elements) patches several DOM constructors with APIs from the custom elements spec:
- `HTMLElement` gets custom element callbacks like `connectedCallback` and `attributeChangedCallback` (which we'll discuss in the next post in more detail). on its prototype.
- `Element` gets `attachShadow`, and methods like `setAttribute` and the `innerHTML` setter are patched to work with the polyfilled custom element callbacks.
- DOM APIs on `Node` like `appendChild` are similarly patched
- The `Document#createElement` *et al.* get similar treatment.

It also exposes the `customElements` object on the `window`, so you can register your components.

The polyfill upgrades custom elements after `DOMContentLoaded`, then initializes a `MutationObserver` to upgrade any custom elements that are subsequently attached with JavaScript.

### Supporting IE11
<figure>

https://youtu.be/NzGMUQscr7Q

  <figcaption>How I feel when someone tells me they need to support IE11.</figcaption>
</figure>

`<rant>`

The polyfills support IE11, but it's not all sunshine and rainbows. IE11 is no longer developed by MS, which means it *should not* be used. Deciding to support IE11 means added development time, added complexity, added surface area for bugs, and exposing users to a buggy, outdated browser. Any time IE11 support is raised as a requirement, it has to be carefully evaluated. Don't just lump it in as a "nice to have". It's *not* nice to have. If it's not an absolute requirement based on unavoidable circumstances, better to not support it at all.

`</rant>`

*phew*. Ok, on with the show.

 Per spec, custom elements must be defined with JavaScript `class`es, but IE11 will never support that feature of ES6. So we have to transpile our classes to ES5 with babel or some such tool. If you're using the [Polymer CLI](https://www.polymer-project.org/3.0/docs/tools/polymer-cli), there's an option to transpile JS to ES5.

 In an ideal world, you would build two or more versions of your site:
1. Written using `class` keyword and es2015+ features for evergreen/modern browsers
1. Transpiled to ES5 using `function` keyword classes
1. And any other shades in-between you want to support.

You would then [differentially serve your app](https://github.com/Polymer/prpl-server), sending fast, light, modern code to capable user agents, and slow, transpiled, legacy code to old browsers.

But this is not always an option. If you have simple static hosting and need to build a single bundle for all browsers, you will be forced to transpile to ES5, which is not compatible with the native `customElements` implementation.

For cases like that, the polyfill provides a [shim for the native customElements implementation which supports ES5-style `function` keyword elements](https://github.com/webcomponents/custom-elements/blob/master/src/native-shim.js) Make sure to include it in your build (don't transpile this file!) if you're targeting old and new browsers with the same bundle.

```html
<script src="/node_modules/@webcomponents/webcomponentsjs/entrypoints/custom-elements-es5-adapter-index.js"></script>
<script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

Active web-components community member [@ruphin](https://github.com/ruphin) suggests a [neat trick](https://github.com/ruphin/gluonjs/blob/master/examples/index.html) you can use to provide a sort of differential serving even on a static host is to leverage the browser's `nomodule` feature:

```html
<!-- This loads the app as a module on Chrome, Edge, Firefox, and Safari -->
<!-- Modules are always nonblocking, and they load after regular scripts, so we can put them first -->
<script type="module" src="/index.js"></script>

<!-- This loads the app on IE11 -->
<script nomodule src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
<!-- Take a look at rollup.config.js to see how to build this guy -->
<script nomodule src="./index.nomodule.js"></script>
```

Check out his light-weight web-components framework, gluonjs

<github-repository owner-repo="ruphin/gluonjs"></github-repository>

## Conclusion

The webcomponentsjs polyfills let you run your webcomponents in older browsers. True, there are some hoops you have to jump through to make it work, but if you're using a web component helper library to define your elements, that will mostly be taken care of for you.

In our next post, God-willing, we'll explore writing web components with vanilla browser APIs for maximum control and interoperability.

### Errata
- A previous version of this article recommended importing the polyfill in a module like so: `import '@webcomponents/webcomponentsjs/webcomponents-loader.js';`
  Don't do this. Instead, the polyfills should be loaded in the document `head`, before any other modules are loaded. The article has been corrected with an updated example.
- A previous version of this article recommended against loading specific polyfills. The current version provides more depth on why and when you might choose to do so.
- A previous version of this article used `this.shadowRoot.append`, which works on supporting browsers. It's preferable to use `this.shadowRoot.appendChild`, which works with the polyfills as well.
- A previous version of this article showed examples of attaching a shadow root in `connectedCallback` without first checking if a shadow root already exists. The examples have been updated.
- Since this post was originally published, [Microsoft has begun development on the web components standards in Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/customelements/). Party time!

Check out the next article in the series

[Part 3: Vanilla Components](../part-3-vanilla-components)

Would you like a one-on-one mentoring session on any of the topics covered here? [![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

