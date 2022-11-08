---
title: 'Lets Build Web Components! Part 5: LitElement'
description: Reactive Components without compiling or VDOM Overhead? Say hello to LitElement.
datePublished: 2018-10-23
published: true
cover_image: https://thepracticaldev.s3.amazonaws.com/i/imq3tb3j6fuutrtxyfse.png
tags:
  - web components
  - functional programming
  - lit
  - custom elements
  - javascript
  - html
---

Component-based <abbr title="user interface">UI</abbr> is all the rage these
days. Did you know that the web has its own native component module that
doesn't require the use of any libraries? True story! You can write, publish,
and reuse single-file components that will work in
any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any
framework](https://custom-elements-everywhere.com/) (if that's your bag).

In our [last post](../part-4-polymer-library/), we learned about the Polymer
library and its unique approach to data-binding and app composition.

Today we'll implement `<lit-lazy-image>` using the `LitElement` base class.
Compared to Polymer, `LitElement` takes a fundamentally different approach to
templating, one which is much more congruent to the reactive style of
programming which has become so widespread in front-end in the last few years.
With one-way data flow, a declarative syntax for binding data and event
listeners, and a
[standards](https://dev.to/bennypowers/lets-build-web-components-part-1-the-standards-3e85)-based
approach to efficient <abbr title="document object model">DOM</abbr> updates,
`LitElement`s are performant and a pleasure to write.

- [`lit-html`](#lit-html)
    - [Functional UI](#functional-UI)
    - [Data Binding](#data-binding)
    - [Directives](#directives)
- [`LitElement`](#litelement)
- [`<lit-lazy-image>`](#lit-lazy-image)
- [Attributes and Properties](#attributes-and-properties)
    - [Reflecting Properties to Attributes](#reflecting-properties-to-attributes)
    - [Controlling Serialization](#controlling-serialization)
    - [Determining when a Property Has Changed](#determining-when-a-property-has-changed)
- [`LitElement` Lifecycle](#litelement-lifecycle)
    - [`shouldUpdate`](#shouldupdate)
    - [`update`](#update)
    - [`firstUpdated` and `updated`](#firstupdated-and-updated)
    - [`requestUpdate`](#requestupdate)
    - [`updateComplete`](#updatecomplete)
- [Factoring Apps with `LitElement`](#factoring-apps-with-litelement)

But before we dive in, let's take a minute to explore the `lit-html` library,
which is the foundation of `LitElement`

## `lit-html`

`lit-html` is a new library (currently in pre-release) by Justin Fagnani, an
engineer at Google. You use it to write dynamic and expressive DOM templates in
JavaScript. If you've worked with React's JSX, you've doubtless written and
composed similar templates. Unlike JSX, `lit-html` leverages the browser's
built-in <abbr title="HyperText Markup Language">HTML</abbr> parser, and
standards like the
[`<template>`](https://dev.to/bennypowers/lets-build-web-components-part-1-the-standards-3e85#template-elements)
element and [tagged template
literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
to efficiently update the DOM without any "Virtual DOM" overhead.

### Functional UI

![the equation "UI = f(data)" with a subtle translucent Greek capital lambda in
the
background](https://thepracticaldev.s3.amazonaws.com/i/q9ov8dv9v0ibfddg8a66.png)

With `lit-html` templates, we're entering the world of functional programming
in JavaScript. We'll be using terms like 'pure' and 'impure' functions a lot in
this article, so for an introduction or refresher on functional concepts, check
out Brian Lonsdorf's canonical [Mostly Adequate Guide to Functional
Programming](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/), but
for our purposes we'll be interested in a few basic concepts:

- **Pure Functions**: Functions that take an input and return an output without
  referencing or affecting any other data.
- **Impure Functions**: Functions that produce side effects.
- **Side Effects**: Anything that happens asides from immediately computing
  some result from some input, e.g. writing to the `console.log` or the
  `document`, or accessing global variables.

So when we say "UI as a function of data", we mean that without having to use
anything other than our data, we can compute a piece of UI.

```js
import { html, render } from 'lit-html';

/* lit-html: UI as a pure function of data */
const view = ({ content, title }) =>
  html`<h1>${title}</h1>${content}`;

/* Compose templates from other templates */
const title = 'View as a Pure Function of Data';
const content = html`
  <p>Composable templates are flexible and powerful. They let you define
  complex views from simple building blocks.</p>
  <p>Using composition, you can hide implementation details of your
  app. This makes your work easier to test, reason about, and debug.</p>`;

/* Everything up to now has been pure. By calling `render`,
 * we pull the trigger on the impure part of our app and
 * actually write our view to the screen. */
render(view({ content, title }), document.body);
```

The `html` function (template literal tags are just functions) returns a
special type called a `TemplateResult`, which knows about its static parts and
its dynamic parts (or interpolated expressions i.e. the changing
`${someExpression}` parts) in its template literals. The `render` function
takes a `TemplateResult` along with a containing node to dynamically update the
DOM. By storing the locations in DOM that might react to changing values of
expressions in templates, `lit-html` can efficiently update those parts of the
DOM each render call, without having to re-render the whole tree.

This is similar enough in practice to React's JSX, but let's take a step back
to appreciate the differences, so we can make more informed choices. Here is a
non-exhaustive list of all the web standards mentioned or alluded to In the
previous paragraph:
- [Template
  Literals](http://www.ecma-international.org/ecma-262/6.0/#sec-template-literals)
  - JavaScript Strings with powerful interpolation features
- [Tagged Template
  Literals](http://www.ecma-international.org/ecma-262/6.0/#sec-tagged-templates)
  - Specially-written functions that act specifically on Template Literals
- [Template Tags Knowing their Static and Dynamic
  Parts](http://www.ecma-international.org/ecma-262/6.0/#sec-gettemplateobject)
  This isn't a bespoke library feature, `lit-html` leverages the standards
- [WeakMap](https://www.ecma-international.org/ecma-262/6.0/#sec-weakmap-objects)
  to hold the map of template parts to their associated Nodes

Since `lit-html` rests exclusively on standards, it runs directly in the
browser. It doesn't require any build step, compilation, transforms, or
anything like that. In fact I've factored many apps with lit-html using nothing
but `.js` files - just hit save and refresh!

So, the `lit-html` library's <span lang="fr">*raison d'être*</span> is to use
established, browser-native web standards to let developers write dynamic and
expressive HTML-in-JS while handling efficient DOM updates behind the scenes.

For the scoop on that, let's hear it right from the horse' mouth:

https://youtu.be/ruql541T7gc?t=7m46s

### Data Binding

In `lit-html` templates, you can insert JavaScript expressions in place of any
node, or as the value of any attribute. Let's imagine a hypothetical product
page where we want to fetch a collection of product objects from our API, then
output an HTML template for each.

We can interpolate attribute values with any data we want:

```js
const star = value => html`
  <meter class="star-rating"
      min="0" max="5"
      value="${value}"
  ></meter>`;
```

We can declaratively define event listeners by passing in a function with a
special `@event-type` binding syntax. We'll imagine an example that uses some
`analytics` function (presumably imported from elsewhere) to report when our
product images load on screen.

```js
const lazyThumbnail = ({ id, alt, thumbnail }) => html`
  <lazy-image
      src="${`https://product-cdn.awesomeshop.com/images/${thumbnail}`}"
      alt="${alt}"
      @loaded-changed="${event => analytics('thumbnail-viewed', { event, id })}"
  ></lazy-image>`;
```

For more control over the listener behaviour, we could pass in a special
listener descriptor object. This is also more memory-efficient since it doesn't
create a new lambda (i.e. anonymous arrow function) for each render:

```js
const listener = {
  handleEvent: event =>
    analytics('thumbnail-viewed', {
      event, id: event.target.dataset.productId
    }),
  passive: true,
  once: true,
};

const lazyThumbnail = ({ id }) => html`
  <lazy-image
      data-product-id="${id}"   
      @loaded-changed="${listener}"
  ></lazy-image>`;
```

<aside>Naturally, you could just define the lambda outside your templates as
well, you don't need to build a special listener descriptor.</aside>

If we wanted to bind to an element's DOM properties instead of it's HTML
attributes, we can use the `.property` binding syntax.

```js
html`<img .src="${srcProperty}"/>`;
```

*Note* that unlike expensive attribute updates which are guarded to only run
when the value actually changes, property assignments happen on each render,
whether or not the value has changed. So be careful of calling setters with
side effects.

We can also un/set boolean attributes with the special `?attribute` syntax:

```js
const stockBadge = ({ inventory }) => html`
  <aside class="badge" ?hidden="${inventory > 0}">
    Out of stock!
  </aside>`;
```

In that way, we created a `stockBadge` template which displays an 'Out of
Stock!' message when the inventory is low, a `lazyThumbnail` badge which
lazy-loads the product image and notifies our analytics service when it appears
on screen, and a `star` template which displays a special star-rating via the
`<meter>` built-in element.

Now we can compose our product template together:

```js
const product = ({ id, rating, thumbnail, alt, url, inventory }) => html`
  <article class="product" data-product-id="${id}">
    ${stockBadge({ inventory })}
    ${lazyThumbnail({ id, alt, thumbnail })}
    ${star(rating)}
    <a class="btn-link" href="${url}">Read More</a>
  </article>`;
```

With all that in place, generating an entire page's worth of `TemplateResult`s
would be straightforward:

```js
const productPage = products => products.map(product);
```

Then, in the impure part of our app, we'd brave the elements to fetch and
render our data.

```js
const handleAsJson = response => response.json();

const renderToProductContainer = templateResult =>
  render(templateResult, document.getElementById('products'))

fetch('/api/products?page=1')     // Fetch the array of products
  .then(handleAsJson)             // Parse the response as JSON
  .then(productPage)              // Map `product` over the array,
                                  // converting it to an array of TemplateResults.
  .then(renderToProductContainer) // Render the templates to the DOM.
```

### Directives

`lit-html` comes with a variety of template helper functions called
**directives**. They are meant to be called inside of a template definition.
They interact with the internal `lit-html` <abbr title="Application Programmer
Interface">API</abbr>s that compute `TemplateResults`, usually to improve
rendering performance.

```js
import { repeat } from 'lit-html/directives/repeat.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

const getId = ({ id }) => id;

const stooges = [
  { id: 1, name: 'Larry', img: 'images/larry.jpg' },
  { id: 2, name: 'Curly' },
  { id: 3, name: 'Moe', img: 'image/moe.jpg' }
];

const stoogeTpl = ({ id, name, img }) => html`
  <li data-stooge="${id}">
    <img src="${ifDefined(img)}"/>
  </li>`;

const stoogesTpl = html`<ul>${repeat(stooges, getId, stoogeTpl)}</ul>`;
```

The `repeat` directive is used like `Array#map` to generate a list of templates
from an Array. As of this writing it appears that for most use cases
`Array#map` is just as if not more performant than `repeat`. But for cases
where you will be changing the order of a large list of items that have their
own IDs, `repeat` is where it's at.

`ifDefined` is used to check if a value is defined before outputting the
associated DOM. It's useful when you only want to apply an attribute in the
case that your value exists, like we've done with `<img src>` above.

The `until` directive can be used to wait on a promise, showing some default
content in the mean time.

```js
html`<h1>${until({
  this.userPromise.then(user => user.name),
  'Loading User...'
})}</h1>`;
```

The `when` directive functions just like the ternary (`x ? y : z`) expression,
but it's lazy. You pass an expression, and two functions that return
`TemplateResult`s for the truthy and falsy cases of some expression, they will
only be evaluated as needed.

```js
const postTpl = ({ title, summary }) => html`
  <dt>${title}</dt>
  <dd>${summary}</dd>`

const userPostsTpl = ({ name, posts = [] }) => html`
  <h1>${name}'s Posts</h1>
  <dl>${posts.map(postTpl)}</dl>`

const loggedOutTpl = () => html`
  <h1>Log in to see your posts</h1>
  <mwc-button @click="${login}">Login</mwc-button>`

const userPageTpl = (user = { loggedIn: false }) => html`
  <header>
    ${when(user.loggedIn, () => userPostsTpl(user), loggedOutTpl)}
  </header>`;
```

The `guard` directive prevents a re-render until an expression's identity
changes (meaning, if you change the expression from one primitive to another or
from one object reference to another, even if the object's contents are
equivalent)

The `classMap` and `styleMap` directives help you set classes and styles on
your components in a more efficient manner

```js
// Because of lit-html internals, this is inefficient.
const userTpl = ({ token, name }) =>
  html`<div class="user ${ token ? 'loggedIn' : '' }">${name}</div>`;

// Using `classMap` instead keeps your templates efficient.
const userTpl = ({ token, name }) =>
  html`<div class="${classMap({ loggedIn: token, user: true })}">${name}</div>`;
```

The directives APIs are some of the last to be finalized before ye olde big 1.0
launch, so stay up to date by checking the
[README](https://github.com/Polymer/lit-html) and the
[documentation](https://polymer.github.io/lit-html/guide/writing-templates#directives)

## `LitElement`

You can and should use `lit-html` on its own in your projects. But we're here
to talk web components. It just so happens to be that the `LitElement` base
class is the official custom element class for working with `lit-html`.

If `lit-html` is about computing UI with pure functions, then `LitElement` is
about hitching that mechanism to a very object-oriented `customElement` class.
When you extend from it and provide a `render()` method that returns a
`TemplateResult`, `LitElement` takes care of batching DOM updates for you.

```js
import { LitElement, html } from 'lit-element';

const superlativeTpl = superlative =>
  html`<li>So <em>${superlative}</em>!!</li>`

class SoLit extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      superlatives: { type: {
        fromAttribute: attr => attr.split(','),
        toAttribute: xs => xs.join(),
      } },
    }
  }

  render() {
    return html`
      <h1>${this.title}</h1>
      <p>Proof:</p>
      <ul>${this.superlatives.map(superlativeTpl)}</ul>
    `;
  }
}
```

With this brief introduction to the new hotness that `lit-html` and
`LitElement` bring, we're ready to start our refactor of `<lazy-image>`.

## `<lit-lazy-image>`

Just like [last week](../part-4-polymer-library/), our first step will be to
import our dependencies and rename the component.

```js
import { LitElement, html } from 'lit-element';

const isIntersecting = ({isIntersecting}) => isIntersecting;

const tagName = 'lit-lazy-image';

class LitLazyImage extends LitElement {/*..*/}

customElements.define(tagName, LitLazyImage);
```

Next we'll define our render method, using `<polymer-lazy-image>`'s as a
template (pun!), but replacing the static binding expression strings with <abbr
title="JavaScript">JS</abbr> expressions, and adjusting the binding syntax. All
of the styles will stay the same as the ones we used for
`<polymer-lazy-image>`.

```js
render() {
  return html`
    <style>/*...*/</style>

    <div id="placeholder" aria-hidden="${String(!!this.intersecting)}">
      <slot name="placeholder"></slot>
    </div>

    <img id="image"
        aria-hidden="${String(!this.intersecting)}"
        .src="${this.intersecting ? this.src : undefined}"
        alt="${this.alt}"
        @load="${this.onLoad}"
    />
  `;
}
```

<aside>

*Note* that we could have used `ifDefined` here, but for such a simple
component, with such a simple usage, I think the performance gains of using
directives would be outweighed by the cost of loading more JS.

</aside>

Since we can interpolate actual JavaScript expressions, we don't need any of
the computed binding methods from our polymer-based implementation. We likewise
don't need the property getters and setters from the vanilla version, since
LitElement has its own mechanism for managing properties and attributes. [We'll
discuss LitElement's properties system in more depth later
on.](#attributes-and-properties). For now, it's enough to define our observed
attributes in a static getter:

```js
static get properties() {
  return {
    alt: { type: String },
    intersecting: { type: Boolean },
    src: { type: String },
    loaded: {
      type: Boolean,
      reflect: true,
    },
  }
}
```

And really, that's basically it. One small change I made was to explicitly fire
a `loaded-changed` event when the image loads up, to maintain compatibility
with Polymer-style templating systems:

```js
onLoad(event) {
  this.loaded = true;
  // Dispatch an event that supports Polymer two-way binding.
  this.dispatchEvent(
    new CustomEvent('loaded-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: true,
      },
    })
  );
}
```

And I took the opportunity to refactor `initIntersectionObserver` to handle its
own feature detection:

```js
initIntersectionObserver() {
  // if IntersectionObserver is unavailable,
  // simply load the image.
  if (!('IntersectionObserver' in window)) {
    return this.intersecting = true;
  }
  // ...
}
```

But the truth is that thanks to `lit-html`, we've deleted a lot more than we've
added here.

Here's our completed component, Check out the
[diff](http://www.mergely.com/BUNgerD7/?wl=1&ws=1&cs=1&vp=1), down to 140 <abbr
title="Lines of Code">LOC</abbr> from `<polymer-lazy-image>`'s 160 and
`<lazy-image>`'s 195:

```js
import { LitElement, html } from 'lit-element';

const isIntersecting = ({isIntersecting}) => isIntersecting;

const tagName = 'lit-lazy-image';

class LitLazyImage extends LitElement {
  render() {
    return html`
      <style>
        :host {
          position: relative;
        }

        #image,
        #placeholder ::slotted(*) {
          position: absolute;
          top: 0;
          left: 0;
          transition:
            opacity
            var(--lazy-image-fade-duration, 0.3s)
            var(--lazy-image-fade-easing, ease);
          object-fit: var(--lazy-image-fit, contain);
          width: var(--lazy-image-width, 100%);
          height: var(--lazy-image-height, 100%);
        }

        #placeholder ::slotted(*),
        :host([loaded]) #image {
          opacity: 1;
        }

        #image,
        :host([loaded]) #placeholder ::slotted(*) {
          opacity: 0;
        }
      </style>

      <div id="placeholder" aria-hidden="${String(!!this.intersecting)}">
        <slot name="placeholder"></slot>
      </div>

      <img id="image"
        aria-hidden="${String(!this.intersecting)}"
        .src="${this.intersecting ? this.src : undefined}"
        alt="${this.alt}"
        @load="${this.onLoad}"
      />
    `;
  }

  static get properties() {
    return {
      /**
       * Image alt-text.
       * @type {String}
       */
      alt: { type: String },

      /**
       * Whether the element is on screen.
       * @type {Boolean}
       */     
      intersecting: { type: Boolean },

      /**
       * Image URI.
       * @type {String}
       */
      src: { type: String },

      /**
       * Whether the image has loaded.
       * @type {Boolean}
       */
      loaded: {
        type: Boolean,
        reflect: true,
      },
    }
  }

  constructor() {
    super();
    this.observerCallback = this.observerCallback.bind(this);
    this.intersecting = false;
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // Remove the wrapping `<lazy-image>` element from the a11y tree.
    this.setAttribute('role', 'presentation');
    // if IntersectionObserver is available, initialize it.
    this.initIntersectionObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectObserver();
  }

  /**
   * Sets the `intersecting` property when the element is on screen.
   * @param  {[IntersectionObserverEntry]} entries
   * @protected
   */
  observerCallback(entries) {
    if (entries.some(isIntersecting)) this.intersecting = true;
  }

  /**
   * Sets the `loaded` property when the image is finished loading.
   * @protected
   */
  onLoad(event) {
    this.loaded = true;
    // Dispatch an event that supports Polymer two-way binding.
    const bubbles = true;
    const composed = true;
    const detail = { value: true };
    this.dispatchEvent(new CustomEvent('loaded-changed', { bubbles, composed, detail }));
  }

  /**
   * Initializes the IntersectionObserver when the element instantiates.
   * @protected
   */
  initIntersectionObserver() {
    // if IntersectionObserver is unavailable, simply load the image.
    if (!('IntersectionObserver' in window)) return this.intersecting = true;
    // Short-circuit if observer has already initialized.
    if (this.observer) return;
    // Start loading the image 10px before it appears on screen
    const rootMargin = '10px';
    this.observer = new IntersectionObserver(this.observerCallback, { rootMargin });
    this.observer.observe(this);
  }

  /**
   * Disconnects and unloads the IntersectionObserver.
   * @protected
   */
  disconnectObserver() {
    this.observer.disconnect();
    this.observer = null;
    delete this.observer;
  }
}

customElements.define(tagName, LitLazyImage);
```

{% glitch 'lit-lazy-image', 'app' %}

There's much more to learn about `LitElement` than our simple lazy-loading
example demonstrates. Let's dive in to the API and see what we can see.

## Attributes and Properties

`LitElement` comes with the ability to define property and attribute
descriptors. These are similar to the ones we used with `PolymerElement` last
week, but `LitElement`'s are at once more powerful and more flexible.

Any property defined in the static `properties` getter will be added to the
list of `observedAttributes` (for more on that, see our piece on [vanilla web
components](https://dev.to/bennypowers/lets-build-web-components-part-3-vanilla-components-4on3#the-attributeChangedCallback)).
For simple cases, you can just pass the type constructor of the property.

```js
/**
 * When the `simple` attribute is set,
 * it will also set the `simple` property
 */
simple: { type: String },
```

### Reflecting Properties to Attributes

If you'd like to reflect changes to the property as an attribute, flag the
`reflect` boolean in the property descriptor.

```js
/**
 * Just like `simple`, but it will also set the `reflecting`
 * attribute when the `reflecting` property is set.
 */
reflecting: {
  type: Number, // defaults to `String`
  reflect: true,
},
```

You can also set the `attribute` descriptor to specify *which* attribute to
synchronize with.

```js
/**
 * Like `string` and `reflect`, but this time syncs to the
 * `special-attribute` attribute. If `attribute` is not specified,
 * it will sync with the lowercase property name
 * i.e. `definedattr`
 */
definedAttr: {
  type: String,
  attribute: 'special-attribute', // defaults to `true`
  reflect: true,
},
```

The `attribute` descriptor can be either `false`, in which case the attribute
won't be observed (but setting the DOM property will still run `LitElement`
effects); `true`, in which case the ascii lowercased property name will be
observed; or a string, in which case that specific string will be observed for
that property.

### Controlling Serialization

Serialization means converting data like numbers, arrays, or objects, to a
format that can reliably be sent one piece at a time, like a string. It happens
to be that all HTML attribute values are strings, so when we talk about
serialization <abbr title="with respect to">w.r.t.</abbr> DOM properties, we're
talking stringification.

If you want to control how that process works in your element, you can specify
in the `type` descriptor a function to handle serialization (defaults to the
`String` constructor). For fine-grained control over the process, set `type` to
an object with functions at the properties `fromAttribute` and `toAttribute`.

```html
<super-serializer serialized="a|b|c|d"></super-serializer>

<script type="module">
  import { LitElement } from 'lit-element';

  class extends LitElement {
    static get properties() {
      return {
        serialized: {
          type: {
            fromAttribute: x => x.split('|')
            toAttribute: xs => xs.join('|')
          }
        }
      }
    }
  };

  customElements.define('super-serializer', SuperSerializer);

  const el = document.querySelector('super-serializer');

  (async () => {
    console.log(el.serialized); // ["a", "b", "c", "d"]

    el.serialized = [1, 2, 3, 4];

    await el.updateComplete;

    console.log(el.serialized); // [1, 2, 3, 4]
    console.log(el.getAttribute('serialized')) // "1|2|3|4"
  })();
</script>
```

### Determining when a Property Has Changed

You can control how your element will react to property changes by setting the
`hasChanged` property of a property descriptor to a predicate function
(meaning, a function that returns a Boolean). This will be pretty useful when
your property is a reference type like `Object` or `Array`.

The signature of the `hasChanged` function is `(newVal, oldVal) -> Boolean`, so
you could do something like:

```js
const userType = {
  fromAttribute: id => getUserSync(users, id),
  toAttribute: ({ id }) => id,
};

const userHasChanged = (
  { id, avatar, name } = {},
  { id: oldId, avatar: oldAvatar, name: oldName } = {}
) => (
  id !== oldId ||
  avatar !== oldAvatar ||
  name !== oldName
);

static get properties() {
  return {
    user: {
      type: userType,
      hasChanged: userHasChanged,
    }
  }
}
```

You'd use `hasChanged` for fine-grained control over the element's lifecycle on
a per-property basis. There are also a number of methods that you can implement
in your element to affect how the lifecycle turns.

### `LitElement` Lifecycle

In addition to the [standard custom element lifecycle
callbacks](https://dev.to/bennypowers/lets-build-web-components-part-3-vanilla-components-4on3#lifecycle-callbacks),
`LitElement` provides a number of specific methods which help you control how
and when your element renders.

#### `shouldUpdate`

To control whether or not your element re-renders, implement the `shouldUpdate`
function which takes a `Map` of changed properties, which refers to the old
values.

```js
shouldUpdate(changedProperties) {
  return !changedProperties.has('dataOnlyProp') || changed;
}
```

By default, `shouldUpdate` returns `true`.

#### `update`

We've already seen the `render` method, which determines the element's
template. `render` is called by the `update` method, which, like
`shouldUpdate`, takes a `Map` of changed properties. You might use `update` to
perform side-effects not related to the DOM. Don't manipulate properties here,
since setting them won't trigger another update.

```js
update(changedProperties) {
  // Don't forget this or your element won't render!
  super.update(changedProperties);
  if (changedProperties.get('loggedIn') && !this.loginReported) {
    Analytics.report('Logged In', this.user.id)
    this.loginReported = true;
  }
}
```

#### `firstUpdated` and `updated`

But if you want to perform side effects related to the DOM, like getting a
reference to a shadow-child or setting a light-child attribute, you should use
either `firstUpdated` or `updated`:

```js
/**
 * firstUpdated runs once after the element renders for
 * the first time. It's ideal for capturing references to
 * shadow children, etc.
 * @param  {Map<string, any>} changedProperties
 */
firstUpdated(changedProperties) {
  // Capture references to shadow children.
  this.player = this.shadowRoot.querySelector('video');
  // Setting observed properties here will trigger an update.
  this.loaded = true;
}

/**
 * Updated runs every time the element renders, so it's well-
 * suited for managing light DOM children, or anything else that you
 * don't directly control in your template.
 * @param  {Map<string, any>} changedProperties
 */
updated(changedProperties) {
  this.children.forEach(child => setAttribute('updated', new Date()))
  super.updated(changedProperties);
}
```

Setting observed properties in either `firstUpdated` or `updated` will trigger
a re-render.

#### `requestUpdate`

The `requestUpdate` method which will explicitly cause the element to update
and re-render. You can call this method in one of two ways. Calling without
arguments will simply re-render the element. This is useful when for example
you want to set some element state based on something other than properties,
like light DOM children.

```js
// Get a DOM reference to your element
const myLitEl = document.querySelector('my-lit-element');

// When the element's light DOM mutates, call `requestUpdate`
const onMutation = ([{target}]) => target.requestUpdate();

const observer = new MutationObserver(onMutation);

observer.observe(myLitEl, {
  attributes: false,
  childList: true,
  subtree: true,
});
```

When you call `requestUpdate` with a specific property and value, `LitElement`
will run the side effects configured for that property, for example reflecting
its attribute. You should do this if you've implemented setters for your
properties.

```js
set customProp(value) {
  // Do your thing, we try not to judge - honest!
  weirdSideEffect(value);
  // Make sure LitElement has its house in order.
  this.requestUpdate('customProp', this.customProp)
}
```

#### `updateComplete`

The `updateComplete` property (**NOTE: Not a method!!**) is a promise that
resolves when rendering is finished. You'll notice we've used it in some of our
earlier examples. Wait for this promise when you want to access the updated
DOM.

```js
class MouseMachine extends LitElement {
  static get properties() {
    return {
      meaning: {
        type: String,
        attribute: 'life-the-universe-and-everything',
      },
    };
  }
};

customElements.define('mouse-machine', MouseMachine);

const mm = document.createElement('mouse-machine');

document.body.append(mm);

(async () => {
  mm.meaning = 42;

  await mm.updateComplete;

  console.log(myLitEl.getAttribute('life-the-universe-and-everything'));
});
```

## Factoring Apps with `LitElement`

Unlike Polymer elements, with their two-way-binding templates, lit elements are
particularly well suited to the types of one-way data flows popularized by the
React/Redux pattern and others. You can create or import class mixins which
connect your elements to your central store and update their props. In fact,
I've released a set of base classes which extend from `LitElement` that connect
your components to an Apollo GraphQL client cache. Check it out:

<github-repository owner-repo="bennypowers/lit-apollo">

The PWA Starter Kit is a fully-realised example of an app factored with
`LitElement` and `Redux`.

<github-repository owner-repo="polymer/pwa-starter-kit">

But since lit-elements are just DOM, you can set their properties with vanilla
JavaScript, which means that you can use any state management solution that
speaks JavaScript, pre-made or bespoke.

A future post will go more into detail about options for factoring
web-component-based apps, so stay tuned!

## Conclusions

Pros | Cons
-----|-----
Functional UI with lit-html and LitElement | Coming from Polymer's two-way binding, it's a change in paradigm.
Based in web standards, no need for babel, typescript, or long toolchains. | The one non-standard usage is bare specifiers, requiring either a bundler or a server-side transform.
Aligns well with patterns and syntax familiar to many popular libraries | Although the community is vocal and growing, it's not yet as large and popular as other libraries (at least, not until you get involved, dear reader)

`LitElement` is set to be the go-to custom element base class for most
projects, but it's far from the only game in town. Join us next week to look at
Gluon, a slimmed-down and simple custom elements framework that gives you key
features without the bloat.

See you then 😊

Would you like a one-on-one mentoring session on any of the topics covered
here? [![Contact me on
Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Acknowledgements

Thanks again are due to [@ruphin](https://github.com/ruphin) for sharing his
insights into `lit-html` and the web components standards, and to Amit Merin
and morbidick in the Polymer community slack for their proofreading.

## Errata

- Since this post was originally published, [lit-html 1.0 and lit-element 2.0
  stable were
  released](https://www.polymer-project.org/blog/2019-02-05-lit-element-and-lit-html-release).
  The pros/cons table has been updated to reflect that.

Check out the next article in the series on [Gluon](../part-6-gluon/)

