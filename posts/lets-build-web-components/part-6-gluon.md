---
title: 'Lets Build Web Components! Part 6: Gluon'
description: Hit that sweet spot between library cruft and bare browser APIs with Gluon web components.
published: true
datePublished: 2018-10-28
coverImage: https://thepracticaldev.s3.amazonaws.com/i/5s5bvccq2tbaij396y7g.png
tags:
  - web components
  - gluon
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

In our [last post][part-5], we learned about `lit-html`, a new functional UI
library from Google, and it's associated custom-element base class
`LitElement`.

Today we'll implement `<gluon-lazy-image>` using
[@ruphin](https://github.com/ruphin)'s Gluon library. Like `LitElement`, Gluon
components use `lit-html` to define their templates, but the Gluon base class
is much "closer to the metal": it prefers to remain lightweight, leaving fancy
features like observed or typed properties up to the user.

If you didn't catch last week's [article on lit-html and LitElement][part-5],
take a look now before we dive in.

- [`<gluon-lazy-image>`](#gluon-lazy-image)
- [Element Template](#element-template)
- [Properties and Attributes](#properties-and-attributes)
- [Rendering and Lifecycle](#rendering-and-lifecycle)
- [Other Niceties](#other-niceties)
- [Complete Component](#complete-component)

## `<gluon-lazy-image>`

Our refactor of `<gluon-lazy-image>` will be, as you might have expected, a
mashup of the vanilla `<lazy-image>` component with `<lit-lazy-image>` from
last week. Let's start by importing our dependencies and defining our class.

```js
import { GluonElement, html } from '/node_modules/@gluon/gluon/gluon.js';

class GluonLazyImage extends GluonElement {/*..*/}

customElements.define(GluonLazyImage.is, GluonLazyImage);
```

One small convenience to notice right off the bat is that Gluon prepares a
static `is` getter for us that returns the camel-cased class name. It's a small
kindness, but will make refactoring easier if we ever decided to change our
element's name. Of course, if we wanted to override the element name, we could
just override the static getter.

Next up, we'll define the template in an instance getter:

## Element Template

```js
class GluonLazyImage extends GluonElement {
  get template() {
    return html`<!-- template copied from LitLazyImage -->`;
  }
}
```

## Properties and Attributes

For the properties, we'll implement `observedAttributes` and property setters
ourselves, just like we did with vanilla `<lazy-image>`:

```js
static get observedAttributes() {
  return ['alt', 'src'];
}

/**
 * Implement the vanilla `attributeChangedCallback`
 * to observe and sync attributes.
 */
attributeChangedCallback(name, oldVal, newVal) {
  switch (name) {
    case 'alt': return this.alt = newVal
    case 'src': return this.src = newVal
  }
}
```

Rather than declaring types statically, note how we coerce the value in the
setter, this is how you do typed properties with Gluon.

```js
/**
 * Whether the element is on screen.
 * @type {Boolean}
 */     
get intersecting() {
  return !!this.__intersecting;
}
```

Just like in vanilla `<lazy-image>`, we'll use guarded property setters to
reflect to attributes.

```js
/**
 * Image alt-text.
 * @type {String}
 */
get alt() {
  return this.getAttribute('alt');
}

set alt(value) {
  if (this.alt != value) this.setAttribute('alt', value);
  this.render();
}
```

## Rendering and Lifecycle

Gluon elements have a `render()` method which you call to update the element's
DOM. There's no automatic rendering, so you should call `render()` in your
property setters. `render()` batches and defers DOM updates when called without
arguments, so it's very cheap.

```js
set intersecting(value) {
  this.__intersecting = !!value;
  this.render();
}

set src(value) {
  if (this.src != value) this.setAttribute('src', value);
  this.render();
}
```

`render()` returns a promise. You can also force a synchronous render with
`render({ sync: true })`.

The notion of component lifecycle is similarly simplified. Rather than
introduce new callbacks like `LitElement` does, if you want to manage your
element's DOM etc, you just wait on the `render()` promise.

```js
const lazyImage = document.querySelector('gluon-lazy-image');

(async () => {
  // Force and wait for a render.
  await lazyImage.render();
  // Do whatever you need to do with your element's updated DOM.
  console.log(lazyImage.$.image.readyState);
})();
```

## Other Niceties

Gluon will pack your element's `$` property with references to id'd elements in
the shadow root at first render. So in our case we could get
`lazyImage.$.image` or `lazyImage.$.placeholder` if we needed references to the
inner image or placeholder elements.

Also, like `LitElement` you can override the `createRenderRoot` class method to
control how your component renders. Return `this` to render your component's
DOM to the Light DOM instead of in a shadow root:

```js
class LightElement extends GluonElement {
  get template() {
    return html`Lightness: <meter min="0" max="1" value="1"></meter>`;
  }

  createRenderRoot() {
    return this;
  }
}
```

## Complete Component

{% glitch 'gluon-lazy-image', 'app' %}

```js
import { GluonElement, html } from 'https://unpkg.com/@gluon/gluon/gluon.js?module';

const isIntersecting = ({isIntersecting}) => isIntersecting;

class GluonLazyImage extends GluonElement {
  get template() {
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

  static get observedAttributes() {
    return ['alt', 'src'];
  }

  /**
   * Implement the vanilla `attributeChangedCallback`
   * to observe and sync attributes.
   */
  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case 'alt': return this.alt = newVal
      case 'src': return this.src = newVal
    }
  }

  /**
   * Whether the element is on screen.
   * Note how we coerce the value,
   * this is how you do typed properties with Gluon.
   * @type {Boolean}
   */     
  get intersecting() {
    return !!this.__intersecting;
  }

  set intersecting(value) {
    this.__intersecting = !!value;
    this.render();
  }

  /**
   * Image alt-text.
   * @type {String}
   */
  get alt() {
    return this.getAttribute('alt');
  }

  set alt(value) {
    if (this.alt != value) this.setAttribute('alt', value);
    this.render();
  }

  /**
   * Image URI.
   * @type {String}
   */
  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    if (this.src != value) this.setAttribute('src', value);
    this.render();
  }

  /**
   * Whether the image has loaded.
   * @type {Boolean}
   */
  get loaded() {
    return this.hasAttribute('loaded');
  }

  set loaded(value) {
    value ? this.setAttribute('loaded', '') : this.removeAttribute('loaded');
    this.render();
  }

  constructor() {
    super();
    this.observerCallback = this.observerCallback.bind(this);
    this.intersecting = false;
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'presentation');
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
    this.dispatchEvent(new CustomEvent('loaded-changed', {
      bubbles: true,
      composed: true,
      detail: { value: true },
    }));
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

customElements.define(GluonLazyImage.is, GluonLazyImage);
```

The file comes in at 190 LOC ([diff](http://www.mergely.com/gZ3wFE9I/?ws=1)),
equivalent to the vanilla component, which makes sense considering Gluon's
hands-off approach.

## Conclusions

If you're looking for a custom element base class that doesn't hold your hand,
but gives you the power of lit-html for templating, `Gluon` is a great choice!

Pros | Cons
-----|-----
Super lightweight and unopinionated | You need to implement many high-level features yourself
Based on the web components standards, so there are few specific APIs to learn | Simplistic lifecycle model means there's potential for lots of repetition.

We've seen how Gluon components straddle the boundary between totally vanilla
low-level APIs and library conveniences. Join us next time for something
*completely* different as we dive into one of the most fascinating web
component libraries yet published - `hybrids`.

See you then 😊

Would you like a one-on-one mentoring session on any of the topics covered
here? [![Contact me on
Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Acknowledgements

It's a pleasure to once again thank [@ruphin](https://github.com/ruphin) for donating his time and energy to this blog series and this post in particular.

Check out the next article in the series on [Hybrids][part-6]

[part-5]: ../part-5-litelement/
[part-6]: ../part-6-hybrids/
