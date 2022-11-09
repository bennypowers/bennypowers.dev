---
title: 'Lets Build Web Components! Part 3: Vanilla Components'
description: You don't need a fancy framework or complicated tools to design components and build apps, you just need your web browser!
datePublished: 2018-10-05
published: true
coverImage: https://thepracticaldev.s3.amazonaws.com/i/jleqsxb3kcmh7zjnwagb.png
tags:
  - web components
  - custom elements
  - javascript
  - html
  - polyfills
---

Component-based <abbr title="user interface">UI</abbr> is all the rage these days. Did you know that the web has its own native component module that doesn't require the use of any libraries? True story! You can write, publish, and reuse single-file components that will work in any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any framework](https://custom-elements-everywhere.com/) (if that's your bag).

In our [last post](../part-2-the-polyfills/), we learned about the JavaScript polyfills that let us ship components to browsers which don't support the specs.

Today, we're getting practical 👷‍♂️, we'll build a single-file web component without any library or framework code. We're going to write an element which lazy-loads images so that the browser only fetches then when they appear (or are about to appear) on screen. We'll make our element **accessible**, and leverage web <abbr title="application programmer interface">API</abbr>s like `IntersectionObserver` to make it **lightweight** and **performant**. We might even add in some extra bells and whistles if we feel like it.

- [The Custom Element Class](#the-custom-element-class)
- [Lifecycle Callbacks](#lifecycle-callbacks)
    - [The `constructor`](#the-constructor)
    - [The `connectedCallback`](#the-connectedCallback)
    - [The `attributeChangedCallback`](#the-attributeChangedCallback)
    - [The `disconnectedCallback`](#the-disconnectedCallback)
    - [The `adoptedCallback`](#the-adoptedCallback)
    - [The Page Lifecycle](#the-page-lifecycle)
- [Lazy Loading](#lazy-loading)
- [Styling Our Component](#styling-our-component)
    - [`:host` and `<slot>`](#host-and-slot)
    - [CSS Custom Properties](#css-custom-properties)
- [Accessibility](#accessibility)
    - [Extending Built-In Elements](#extending-built-in-elements)
    - [Accessible Autonomous Elements](#accessible-autonomous-elements)
- [Conclusions](#conclusions)

Let's get started! Crack open your editor and create a file called `lazy-image.js` This file will contain our component.

## The Custom Element Class
Just like we saw in our first post on the web components standards, our first step will be to initialize and register a custom element class, and provide it with a basic template. We'll improve on the template later, adding our custom behaviours.

```js
const tagName = 'lazy-image';
const template = document.createElement('template');
template.innerHTML = `<img id="image"/>`;

class LazyImage extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

const register = () => customElements.define(tagName, LazyImage);
window.WebComponents ? window.WebComponents.waitFor(register) : register();
```

Alrighty. If you've been following along with our previous posts, this should all seem familiar, but a little review is in order:
1. We create a template element and define our element's shadow <abbr title="document object model">DOM</abbr> inside of it.
1. We define our custom element's behaviour in a `class`.
1. Our element's `connectedCallback` method creates a shadow root and stamps the template into it.

Plop that into your document and giv'er:

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
    <script type="module" src="./lazy-image.js"></script>
  </head>
  <body>
    <lazy-image></lazy-image>
  </body>
</html>
```

{% glitch 'sunset-sink', 'no-files' %}

Exciting, right? Ok, it's a humble beginning but at least it works. If we inspect our element with dev tools, we can see that it contains our shadow DOM, and is associated with our custom element class.

![Dev Tools DOM inspector showing our custom element with a 'custom' badge next to it, and the shadow root containing the img element](https://thepracticaldev.s3.amazonaws.com/i/831jg8zg9zs8jy4cl3hd.png)

That little `custom` badge is Firefox's way of telling us it's a custom element. If you click on the badge, the debugger will pop open on your element's definition. Well done, Firefox Dev Tools team!

In the next section we'll really start cooking.

## Lifecycle Callbacks

Custom elements have four special instance methods which will run at different times:
1. [`connectedCallback`](#the-connectedCallback),
1. [`attributeChangedCallback`](#the-attributeChangedCallback),
1. [`disconnectedCallback`](#the-disconnectedCallback),
1. [`adoptedCallback`](#the-adoptedCallback),

All defined as `null` by default. These, as well as the [`constructor`](#the-constructor), are the custom element lifecycle callbacks.

## The `constructor`
The first of them is the constructor. It runs whenever an element is created, before the element is attached to the document.

```js
// CustomElement's constructor runs
const el = document.createElement('custom-element');
```

A custom element's constructor must not have any parameters, and it must call `super()` on the first line of its body in order to delegate behaviours to `HTMLElement`, `Node`, etc.; and to bind `this` to the element instance. The constructor shouldn't return any value other than `undefined` or `this`;

```js
// Don't do this
class BustedElement extends HTMLElement {
  constructor(bar) {
    this.foo = bar;
    return bar;
  }
}

// Do This
class DecentElement extends HTMLElement {
  constructor() {
    super();
    if (!window.bar) return;
    this.foo = window.bar;
  }
}
```

You might want to access your element's attributes `parentNode`, children, etc. in the constructor, but don't give in to temptation: if your element is not connected  (i.e. attached) to the DOM tree, it wont have been upgraded yet, meaning it won't yet have any children or attributes. Your code will work in a case where the element is already defined in the document before the element is defined, but will fail in a case where JavaScript creates the element.

It's also fine to attach the shadow root in the constructor and append elements to it. But since the polyfills have to add classes to the light DOM, and the element might not have connected yet, we'll be doing it throughout this tutorial in the `connectedCallback`,

For these reasons, it's best to limit the constructor's activity to setting up internal state, including default values, and when using the polyfills, to attach the shadow root and call `styleElement` in `connectedCallback`. Just make sure to check if the `shadowRoot` already exists, or an error will throw the next time your element connects (e.g. via `document.body.append(myLazyImage)`).

```js
// Don't do this
class BustedImage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowImage = this.shadowRoot.getElementById('image');
    // OOPS! Light DOM attributes may not yet exist!
    this.shadowImage.src = this.getAttribute('src');
  }
}

// Do This
class LazyImage extends HTMLElement {
  constructor() {
    super();
    // Set default values of properties, as needed.
    this.src = '';
    // In order to work well with the polyfill,
    // We'll set up the DOM later on, when the element connects.
  }
}
```

## The `connectedCallback`

`connectedCallback` is fired every time your element connects to the DOM, including the first time it is upgraded. It's an opportune moment to set up shadow children and attributes.

```js
const lazyImage = document.createElement('lazy-image'); // constructor runs
document.appendChild(lazyImage); // connectedCallback runs

const container = document.getElementById('container');
container.appendChild(lazyImage); // connectedCallback runs again
```

```js
class LazyImage extends HTMLElement {
  constructor() {
    super();
    this.src = '';
    this.alt = '';
  }

  connectedCallback() {
    // Initialize properties that depend on light DOM
    this.src = this.getAttribute('src') || this.src;
    this.alt = this.getAttribute('alt') || this.alt;
    // Check if shadowRoot exists first
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.shadowImage = this.shadowRoot.getElementById('image')
    }
    // Set the shadow img attributes.
    this.shadowImage.src = this.src;
    this.shadowImage.alt = this.alt;
  }
}
```

{% glitch 'adaptable-order', 'app' %}

Well, this is encouraging. We've set up our shadow DOM and effected some basic plumbing that sets our internal `img` element's `src` and `alt` attributes according to the ones found on our element when it was upgraded.

We want our `shadowImage`'s `src` attribute to be synced with our element's, and we also want those attributes to be synced with the `src` DOM property. With the help of `attributeChangedCallback` and some class setters, we'll make it happen.

## The `attributeChangedCallback`
When you change the `src` attribute of a plain `<img/>` element, the browser responds by fetching and displaying the new image <abbr title="uniform resource locator">URL</abbr>. Similarly, when you use JavaScript to set the `src` property on that element's DOM object, the new value is reflected in the attribute. We want our element to behave the same way. The <abbr title="hypertext markup language">HTML</abbr> specification provides the `attributeChangedCallback` for these kinds of uses.

Any time your element's attributes change, the callback will run with the attribute name, old value, and new value as arguments. But the browser won't observe just any attributes. You have to specify in advance which attributes you want to react to by defining a list of attribute names in a static property called `observedAttributes`:

```js
static get observedAttributes() {
  return ['src', 'alt'];
}
```

With this defined, your element's `attributeChangedCallback` will run whenever any of the `src` or `alt` attributes change. For now we'll just forward values as properties.

```js
attributeChangedCallback(name, oldVal, newVal) {
  this[name] = newVal
}
```

We also want our element to react to property changes by updating it's shadowImage, and by reflecting the new value to an attribute. We'll use setters for that:

```js
class LazyImage extends HTMLElement {
  /**
   * Guards against loops when reflecting observed attributes.
   * @param  {String} name Attribute name
   * @param  {any} value
   * @protected
   */
  safeSetAttribute(name, value) {
    if (this.getAttribute(name) !== value) this.setAttribute(name, value);
  }

  /**
   * Image URI.
   * @type {String}
   */
  set src(value) {
    this.safeSetAttribute('src', value);
    // Set image src
    if (this.shadowImage) this.shadowImage.src = value;
  }

  get src() {
    return this.getAttribute('src')
  }

  /**
   * Image Alt tag.
   * @type {String}
   */
  set alt(value) {
    this.safeSetAttribute('alt', value);
    // Set image alt
    if (this.shadowImage) this.shadowImage.alt = value;
  }

  get alt() {
    return this.getAttribute('alt')
  }

  static get observedAttributes() {
    return ['src', 'alt'];
  }

  connectedCallback() {
    this.src = this.getAttribute('src');
    this.alt = this.getAttribute('alt');
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.shadowImage = this.shadowRoot.getElementById('image');
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    this[name] = newVal;
  }
}
```

{% glitch 'guttural-tarsier', 'app' %}

Pushing the button updates the `src` and `alt` properties and attributes on the custom element as well as it's shadow child.

![inspector showing synchronized attributes](https://thepracticaldev.s3.amazonaws.com/i/zvwg1ew0c9x96wvw4lds.png)

Our element now transparently exposes the main functionality of the native `<img>` element. The next step is to add in our lazy-loading feature. But before we do that let's briefly discuss the last two lifecycle callbacks in the spec.

### The `disconnectedCallback`

Whenever your element needs to do any clean up work before being removed from the DOM, define a `disconnectedCallback` that handles your clean-up work.

```js
disconnectedCallback() {
  /* do cleanup stuff here */
}
```

This will be handy for us later on when we create an `IntersectionObserver` for each instance of our element. For now, we'll leave it as a stub.

### The `adoptedCallback`

Custom elements also have an `adoptedCallback` which runs whenever you call `adoptNode` on a custom element that's inside another document or document fragment. In that case, first the element's `disconnectedCallback` will run when it disconnects from its original document, then the `adoptedCallback`, and finally the `connectedCallback` when it connects to your document.

![giant 🤷‍♂️ emoji](https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/facebook/138/man-shrugging_1f937-200d-2642-fe0f.png)

I think this was mostly intended for the defunct HTML Imports spec. It may well become more relevant if [either](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/html-modules-proposal.md) the [HTML Modules](https://github.com/w3c/webcomponents/issues/645) proposals are adopted. If you have any ideas for use cases, we'll see you in the comments section.

### The Page Lifecycle

Your page lifecycle therefore might look something like this:

1. Fetch critical resources, including polyfill
1. Construct DOM
1. Fetch defered scripts and modules, including `lazy-image.js`
1. DOMContentLoaded - document is finished parsing
1. Polyfills finish setup, `WebComponents.waitFor` calls its callback
1. Custom elements are upgraded - each instance of `<lazy-image>` in the document is upgraded to a custom element. `constructor` and `connectedCallback` run.
1. If JavaScript creates an instance of `<lazy-image>`, the constructor will run. When the instance is connected to the DOM tree, the `connectedCallback` will run.
1. If JavaScript removes an instance of `<lazy-image>` from the DOM, the `disconnectedCallback` will run.

## Lazy Loading

We'll use the [`IntersectionObserver` API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) for lazy-loading. When the image intersects with a rectangle slightly larger than the screen, we'll begin loading it, and Hopefully it will be fully loaded by the time the image scrolls into view. `connectedCallback` is as good a place as any to do that work.

First, let's define a quick predicate at the root of our module's scope:

```js
// isIntersecting :: IntersectionObserverEntry -> Boolean
const isIntersecting = ({isIntersecting}) => isIntersecting
```

Then we can set up the observer when our element instantiates:

```js
constructor() {
  super();
  // Bind the observerCallback so it can access the element with `this`.
  this.observerCallback = this.observerCallback.bind(this);
}

connectedCallback() {
  // initialize pre-upgrade attributes
  this.src = this.getAttribute('src')
  this.alt = this.getAttribute('alt')
  // Set up shadow root.
  if (!this.shadowRoot) {
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowImage = this.shadowRoot.getElementById('image');
  }
  // If IntersectionObserver is available, initialize it.
  // otherwise, simply load the image.
  if ('IntersectionObserver' in window) this.initIntersectionObserver()
  else this.intersecting = true
}

/**
 * Sets the `intersecting` property when the element is on screen.
 * @param  {[IntersectionObserverEntry]} entries
 * @protected
 */
observerCallback(entries) {
  // The observer simply sets a property
  if (entries.some(isIntersecting)) this.intersecting = true
}

/**
 * Initializes the IntersectionObserver when the element instantiates.
 * @protected
 */
initIntersectionObserver() {
  if (this.observer) return;
  // Start loading the image 10px before it appears on screen
  const rootMargin = '10px';
  this.observer =
    new IntersectionObserver(this.observerCallback, { rootMargin });
  this.observer.observe(this);
}
```

When the observer triggers and sets the `intersecting` property, let's reflect it as an attribute, and start loading the image. Since this observer only needs to fire once, we can disconnect and unload it once it's done.

```js
/**
 * Whether the element is on screen.
 * @type {Boolean}
 */
set intersecting(value) {
  if (value) {
    this.shadowImage.src = this.src;
    this.setAttribute('intersecting', '');
    this.disconnectObserver();
  } else {
    this.removeAttribute('intersecting')
  }
}

get intersecting() {
  return this.hasAttribute('intersecting')
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
```

We'll want to unload our observer if the element is removed from the DOM, otherwise we might leak memory. We can use the `disconnectedCallback` for that.

```js
disconnectedCallback() {
  this.disconnectObserver()
}
```

## Styling Our Component

Now we have enough to lazily load up our image once it appears on screen, but we want our element to also provide a nice <abbr title="user experience">UX</abbr> by, for example, loading a placeholder image inline. To do that, we'll style our component by adding a `<style>` tag into our element's shadow root.

```js
const tagName = 'lazy-image';
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      position: relative;
    }

    #image,
    #placeholder ::slotted(*) {
      position: absolute;
      top: 0;
      left: 0;
      transition: opacity 0.3s ease;
    }

    #placeholder ::slotted(*),
    :host([intersecting]) #image {
      opacity: 1;
    }

    #image,
    :host([intersecting]) #placeholder ::slotted(*) {
      opacity: 0;
    }
  </style>

  <div id="placeholder">
    <slot name="placeholder"></slot>
  </div>

  <img id="image"/>
`;

window.ShadyCSS && window.ShadyCSS.prepareTemplate(template, tagName);
```

### `:host` and `<slot>`

Ooooh! New *goodies*! The `:host` <abbr title="cascading style sheets">CSS</abbr> selector refers to the shadow host i.e. the `<lazy-image>` element itself. This is not just a pseudoelement, but also a function, as we see with `:host([intersecting])` which is equivalent to `lazy-image[intersecting]`, if it was selected from outside of the shadow-root.

The `<slot>` element, and it's related `::slotted()` CSS function are parts of the spec that let us pass bits of DOM from the light tree into the shadow tree. You use `<slot>` inside a shadow tree like we saw just above. Then you pass down content from the light DOM like the shadow tree like so:

```html
<!-- light DOM -->
<svg>
  <defs>
    <g id="placeholder-svg">
      <!-- ... -->
    </g>
  </defs>
</svg>

<lazy-image alt="Picture of a cat" src="https://placekitten.com/400/200">
  <svg slot="placeholder"><use xlink:href="#placeholder-svg"/></svg>
</lazy-image>
```

Notice here how we kept in mind the [limitations of the polyfill](https://dev.to/bennypowers/lets-build-web-components-part-2-the-polyfills-dkh#writing-custom-elements-that-work-with-the-polyfills) and wrapped our `<slot>` in a `<div>`, then selected for children of that `<div>` in our CSS.

`<slot>` doesn't actually move or append slotted elements, it just displays them as if they were in the shadow root. So styles that apply to slotted content from the outer document will still apply when it is slotted. Your element can add its own styles to slotted content with the help of the `::slotted()` CSS function.

```css
::slotted(svg) {
  /* applies to any slotted svg element */
}

::slotted(img) {
  /* applies to any slotted img element */
}
```

**NOTE WELL**: `::slotted(*)` selects for *elements only*, not text nodes. It also selects for top-level nodes only, not children:

```css
/* Don't do this */
.wrapper ::slotted(.outer .inner) { /*...*/ }
.wrapper ::slotted(.inner) { /*...*/ }

/* Do this */
.wrapper ::slotted(.outer) { /*...*/ }
```

That's a browser performance optimization, and it can be annoying to work around in some cases, but with creative DOM work and smart app factoring, it can be dealt with.

Slots can be named or anonymous. Name a slot by giving it a `name="slotname"` attribute in shadow DOM, and use it by specifying `<div slot="slotname"></div>` in the light DOM. Named slots are helpful if you want to provide multiple specific customizable features. In our case we're using a named `<slot name="placeholder"></slot>` for explicitness' sake, but we could just as easily have used an anonymous `<slot></slot>`.

```html
<!-- shadow DOM template -->

<style>
  #title-container ::slotted(*) {
    /* styles for title element */
  }
  #content-container ::slotted(*) {
    /* styles for body content */
  }
</style>
<article>
  <div id="title-container">
    <!-- named slot -->
    <slot name="title"></slot>
  </div>

  <div id="content-container">
    <!-- anonymous slot -->
    <slot></slot>
  </div>
</article>

<!-- light DOM -->
<super-article>
  <h2 slot="title">I'm the article title</h2>
  <p>I'm the article content</p>
  <p>I get slotted into the anonymous slot, too</p>
</super-article>
```

Now that we've passed our light DOM placeholder into our shadow tree, let's update our class' methods to handle the placeholder:

```js
set intersecting(value) {
  if (value) {
    // Wait to apply the `intersecting` attribute until the image
    // finishes loading, then update the styles for polyfill browsers
    this.shadowImage.onload = this.setIntersecting;
    this.shadowImage.src = this.src;
    this.disconnectObserver();
  } else {
    this.removeAttribute('intersecting');
  }
}

constructor() {
  super();
  this.setIntersecting = this.setIntersecting.bind(this);
}

/**
 * Sets the intersecting attribute and reload styles if the polyfill is at play.
 * @protected
 */
setIntersecting() {
  this.setAttribute('intersecting', '');
  this.updateShadyStyles();
}

connectedCallback() {
  this.updateShadyStyles();
  /* etc. */
}

/**
 * When the polyfill is at play, ensure that styles are updated.
 * @protected
 */
updateShadyStyles() {
  window.ShadyCSS && window.ShadyCSS.styleElement(this);
}
```

{% glitch 'abalone-mongoose', 'app' %}

😎 Nice! Our autonomous, reusable, single-file custom element loads an image when on screen then fades to it from a slotted placeholder.

<aside>
  By the way, this is a great opportunity to see how the polyfills work up close. If you load this page on a supporting browser, you'll see a style tag in the element's shadow tree, but if you load it on a polyfilled browser like Edge or Firefox 62, you won't see any styles, because the ShadyCSS polyfill lifts shadow styles up to the document's head.
</aside>

Polyfilled|Native
-----|-----
![the shady tree on a polyfilled browser, containing no style element and generated classes for shadow content](https://thepracticaldev.s3.amazonaws.com/i/hij85bkd73g01em15ykt.png)|![the shadow tree on a supporting browser, containing a style tag and no generated class names](https://thepracticaldev.s3.amazonaws.com/i/5fd0z10lt2snl1mptier.png)

### CSS Custom Properties

Shadow DOM keeps our styles isolated from the rest of the document, but that means it's harder for our users to customize our component. Lucky for us, CSS Custom Properties pierce the shadow boundary, so we can use them to expose customizable styles on our elements.

We'll do that simply by defining our styles with custom properties. The syntax of Custom Properties lets use declare variables while assigning default values:

```css
.selector {
  rule: var(--custom-property-name, default);
}
```

So we can style our element with sensible defaults while still affording the user some flexibility:

```css
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
```

Then we can tweak those styles either globally or on a specific element by defining those variables in our document styles:

```css
/* applies to the whole document. */
html {
  --lazy-image-width: 400px;
  --lazy-image-height: 200px;
}

/* applies to specific elements */
lazy-image:last-of-type {
  width: 400px;
  height: 200px;
  --lazy-image-width: 100%;
  --lazy-image-height: 100%;
  --lazy-image-fade-duration: 2s;
  --lazy-image-fade-easing: linear;
}
```

## Accessibility

Before we publish our component, let's make sure that it treats all of our users with respect. You wouldn't serve delicious barbecued short ribs (anyone else hungry?) without trimming the excess hanging on bits and gristle. No one wants to chew on that! Let's trim the fat off our component's <abbr title="accessibility">a11y</abbr> tree.

### Extending Built-In Elements

The custom elements spec provides for [customizing built-in elements](https://html.spec.whatwg.org/multipage/custom-elements.html#customized-built-in-element). For reference, customized built-in elements look like this:

```html
<script>
  customElements.define(
    'lazy-image',
    class LazyImage extends HTMLImageElement {/*...*/},
    { extends: 'img' }
  );
</script>

<img is="lazy-image"/>
```

This looks awesome and would solve so many accessibility-related problems, but [Apple's official position as of this writing](https://developers.google.com/web/fundamentals/web-components/customelements#extendhtml) is that they won't implement it, so we will be writing autonomous custom elements for the time being.

### Accessible Autonomous Elements

Since our component wraps the `<img>` element, instead of extending it, we should try to make all of our wrapping DOM transparent to screen readers. First we'll update our starting markup so that the placeholder is shown to the a11y tree, but not the image.

```html
<div id="placeholder" aria-hidden="false" role="presentation">
  <slot name="placeholder"></slot>
</div>

<img id="image" aria-hidden="true"/>
```

Next, we'll set the `presentation` role so that our element's wrapper is ignored in favour of its contents by screenreaders.

```js
connectedCallback() {
  // Remove the wrapping `<lazy-image>` element from the a11y tree.
  this.setAttribute('role', 'presentation');
  /* etc. */
  this.shadowPlaceholder = this.shadowRoot.getElementById('placeholder');
}
```

And last, we'll swap the `aria-hidden` attributes on our shadow image and placeholders once the image loads.

```js
setIntersecting() {
  /* etc. */
  this.shadowImage.setAttribute('aria-hidden', 'false')
  this.shadowPlaceholder.setAttribute('aria-hidden', 'true')
}
```

Now our a11y tree is nice and tidy, our screen reader users won't be bothered with extraneous DOM.

![accessibility tree screenshot showing one button and two graphics](https://thepracticaldev.s3.amazonaws.com/i/xom3p4i5xruc4w49xp1c.png)

{% glitch 'cream-art', 'app' %}

Killer. Here's our complete module:

```js
const isIntersecting = ({isIntersecting}) => isIntersecting;

const tagName = 'lazy-image';
const template = document.createElement('template');
template.innerHTML = `
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
    :host([intersecting]) #image {
      opacity: 1;
    }

    #image,
    :host([intersecting]) #placeholder ::slotted(*) {
      opacity: 0;
    }
  </style>
  <div id="placeholder" aria-hidden="false">
    <slot name="placeholder"></slot>
  </div>
  <img id="image" aria-hidden="true"/>
`;

window.ShadyCSS && window.ShadyCSS.prepareTemplate(template, tagName);

class LazyImage extends HTMLElement {
  /**
   * Guards against loops when reflecting observed attributes.
   * @param  {String} name Attribute name
   * @param  {any} value
   * @protected
   */
  safeSetAttribute(name, value) {
    if (this.getAttribute(name) !== value) this.setAttribute(name, value);   
  }

  static get observedAttributes() {
    return ['src', 'alt'];
  }

  /**
   * Image URI.
   * @type {String}
   */
  set src(value) {
    this.safeSetAttribute('src', value);
    if (this.shadowImage && this.intersecting) this.shadowImage.src = value;
  }

  get src() {
    return this.getAttribute('src');
  }

  /**
   * Image alt-text.
   * @type {String}
   */
  set alt(value) {
    this.safeSetAttribute('alt', value);
    if (this.shadowImage) this.shadowImage.alt = value;
  }

  get alt() {
    return this.getAttribute('alt');
  }

  set intersecting(value) {
    if (value) {
      this.shadowImage.onload = this.setIntersecting;
      this.shadowImage.src = this.src;
      this.disconnectObserver();
    } else {
      this.removeAttribute('intersecting');
    }
  }

  /**
   * Whether the element is on screen.
   * @type {Boolean}
   */
  get intersecting() {
    return this.hasAttribute('intersecting');
  }

  constructor() {
    super();
    this.observerCallback = this.observerCallback.bind(this);
    this.setIntersecting = this.setIntersecting.bind(this);
  }

  connectedCallback() {
    this.setAttribute('role', 'presentation');
    this.updateShadyStyles();
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.shadowImage = this.shadowRoot.getElementById('image');
      this.shadowPlaceholder = this.shadowRoot.getElementById('placeholder');
      this.src = this.getAttribute('src');
      this.alt = this.getAttribute('alt');
      this.placeholder = this.getAttribute('placeholder');
    }
    if ('IntersectionObserver' in window) this.initIntersectionObserver();
    else this.intersecting = true;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    this[name] = newVal;
  }

  disconnectedCallback() {
    this.disconnectObserver();
  }

  /**
   * When the polyfill is at play, ensure that styles are updated.
   * @protected
   */
  updateShadyStyles() {
    window.ShadyCSS && window.ShadyCSS.styleElement(this);
  }

  /**
   * Sets the intersecting attribute and reload styles if the polyfill is at play.
   * @protected
   */
  setIntersecting(event) {
    this.shadowImage.removeAttribute('aria-hidden');
    this.shadowPlaceholder.setAttribute('aria-hidden', 'true');
    this.setAttribute('intersecting', '');
    this.updateShadyStyles();
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
   * Initializes the IntersectionObserver when the element instantiates.
   * @protected
   */
  initIntersectionObserver() {
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

const register = () => customElements.define(tagName, LazyImage);
window.WebComponents ? window.WebComponents.waitFor(register) : register();
```

You can use `<lazy-image>` in your projects by installing from [npm](https://www.npmjs.com/package/@power-elements/lazy-image) or loading from [unpkg](https://unpkg.com/@power-elements/lazy-image/lazy-image.js).

```bash
npm i -S @power-elements/lazy-image
```

```html
<script type="module" src="https://unpkg.com/@power-elements/lazy-image/lazy-image.js"></script>
```

Contributions are welcome on [GitHub](https://github.com/bennypowers/lazy-image).

## Conclusions

We've accomplished our goal of writing a slick, reusable, accessible, dependency-free, single-file, lazy-loading image component. And it's only 1.94kb compressed, 4.50kb total. What have we learned?

### Vanilla Components Pros and Cons

Pros|Cons
-----|-----
No dependencies needed. Your code is future-proof because it rests on web standards instead of library churn. | You'll need to provide your own helpers. Syncing properties with attributes might become cumbersome.
Small loading footprint since no extra roundtrips for library code are necessary | 0-dep components don't leverage mixins or helper libraries to reduce filesizes in large projects.
No non-standard APIs to learn, maintain, or adapt to. It's just the web. | Low level web primitives can sometimes be cumbersome.
Low-level power gives you control and flexibility. You can factor your components however you want. | You have to go out of your way to support polyfill browsers, whereas with the libraries, polyfill limitations and known issues are abstracted away.

There are definitely advantages and disadvantages to rolling your own. It seems that we can roughly settle on this general rule: if you're building a simple, reusable, independent custom element to expose some specific functionality; vanilla is a fine choice; but for larger projects and teams, the benefits of a library (ready-made or bespoke) quickly accrue.

One thing to consider is that some frameworks enforce uniformity. On some teams that's an advantage, however the component model allows break-away teams to work independently on smaller abstractions, while hiding those sorts of implementation details from the larger team. In any large project, these kinds of things will have to be considered when choosing the appropriate level of abstraction to take on for a component or set of components.

In our next few posts, we'll be exploring some libraries, tools, and optimization strategies which can streamline your web-component development process and app performance. And we're starting with the <abbr title="originally grokked">OG</abbr> web components library: Polymer.

See you then 🕵️‍♂️🕵️‍♀️

Would you like a one-on-one mentoring session on any of the topics covered here? [![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Acknowledgements

Thanks in no particular order to John Teague, Westbrook Johnson, [@ruphin](https://github.com/ruphin), Matt Gawarecki, and Daniel Turner for their suggestions and corrections.

## Errata

- On October 5th, the Edge team(!) [proposed their own version of HTML Modules](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/html-modules-proposal.md)
- Since this post was originally published, [Microsoft has begun development on the web components standards in Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/customelements/). Party time!


Check out the next article in the series on the [Polymer Library](../part-4-polymer-library/).

