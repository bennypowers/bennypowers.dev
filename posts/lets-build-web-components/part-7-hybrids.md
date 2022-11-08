---
title: 'Lets Build Web Components! Part 7: Hybrids'
description: Web Components are the future, but with a little care and some helpful polyfills, they can be the present as well.
datePublished: 2018-10-28
published: true
cover_image: https://thepracticaldev.s3.amazonaws.com/i/e4nqxo9zyspw1552s4b5.png
tags:
  - web components
  - hybrids
  - custom elements
  - javascript
  - html
  - functional programming
---

Component-based <abbr title="user interface">UI</abbr> is all the rage these
days. Did you know that the web has its own native component module that
doesn't require the use of any libraries? True story! You can write, publish,
and reuse single-file components that will work in
any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any
framework](https://custom-elements-everywhere.com/) (if that's your bag).

In our [last post][part-6], we took a look at
[gluon](https://github.com/ruphin/gluonjs) and how it gives you *just* enough
library support to build components quickly without too much extra.

It's been awhile since our last installment (for reasons which I promise have
[nothing to do with Breath of the Wild or Hollow
Knight](https://www.dropbox.com/s/wye1mv18s7gdg6n/Screenshot_20190103-233743.jpg?dl=0)),
but once you see what we have in store, I think you'll agree it was worth the
wait. Today, we're examining our most unusual and (in my humble opinion)
interesting web component library to date -
[**Hybrids**](https://hybrids.js.org). Get ready to get functional as we define
and compose components from simple objects, and register them only as needed.

- [The Big Idea(s)](#the-big-ideas)
- [Templating](#templating)
  - [Hybrids Prefers Properties to Attributes](#hybrids-prefers-properties-to-attributes)
  - [Binding to `class` and `style`](#binding-to-raw-class-endraw-and-raw-style-endraw-)
- [Property Descriptors](#properties)
  - [`get`](#-raw-get-endraw-)
  - [`set`](#-raw-set-endraw-)
  - [`connect`](#-raw-connect-endraw-)
  - [Factories](#factories)
- [Acknowledgements](#acknowledgements)

As is our custom, we'll get a feeling for Hybrids by reimplementing our running
example - a lazy-loading image element. Before we dive in to the
practicalities, though, let's briefly check out some of hybrids unique
features.

## The Big Idea(s)

Unlike all the libraries we've seen so far, Hybrids doesn't deal in typical
[custom-element](../part-1-the-standards/#custom-elements)
classes. Instead of extending from `HTMLElement` or some superclass thereof,
you define your components in terms of <abbr title="Plain Old JavaScript
Objects">POJO</abbr>s:

With Hybrids, you define your elements via a library function, instead of using
the built-in browser facilities:

```js
import { define, html } from 'hybrids';

export const HelloWorld = {
  name: 'World',
  render: ({name}) => html`Hello, ${name}!`;
};

define('hello-world', HelloWorld);
```

That's a fair sight more concise than the vanilla version!

```js
class HelloWorld extends HTMLElement {
  constructor() {
    super();
    this.__name = 'World';
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(document.createTextNode('Hello, '));
    this.shadowRoot.appendChild(document.createTextNode(this.name));
  }

  get name() {
    return this.__name;
  }

  set name(v) {
    this.__name = v;
    this.render();
  }

  render() {
    this.shadowRoot.children[1].data = this.name;
  }
}

customElements.define('hello-world', HelloWorld);
```

What's more, since the element definition is a simple object, it's much easier
to modify elements through composition rather than inheritance:

```js
import { HelloWorld } from './hello-world.js';
define('hello-joe', { ...HelloWorld, name: 'Joe' });
```

But you probably want to write a component that has more to it than "Hello
World". So how do we manage the state of our hybrids components? Let's bring
back our running example `<lazy-image>` element for a slightly more dynamic
usage.

Since hybrids has its own highly idiosyncratic approach to custom elements, our
rewrite of `<lazy-image>` will involve more than just shuffling a few class
getters, so let's take it piece-by-piece, starting with the element's template.

## Templating

We'll define our element's shadow children in a property called (aptly enough)
`render`, which is a [unary
function](https://www.wikiwand.com/en/Unary_function) that takes the host
element (i.e. the element into which we are rendering) as its argument.

{%raw%}
```js
import { dispatch, html } from 'hybrids';

const bubbles = true;
const composed = true;
const detail = { value: true };
const onLoad = host => {
  host.loaded = true;
  // Dispatch an event that supports Polymer two-way binding.
  dispatch(host, 'loaded-changed', { bubbles, composed, detail })
};

const style = html`<style>/*...*/</style>`;
const render = ({alt, src, intersecting, loaded}) => html`
  ${style}
  <div id="placeholder"
      class="${{loaded}}"
      aria-hidden="${String(!!intersecting)}">
    <slot name="placeholder"></slot>
  </div>

  <img id="image"
      class="${{loaded}}"
      aria-hidden="${String(!intersecting)}"
      src="${intersecting ? src : undefined}"
      alt="${alt}"
      onload="${onLoad}"
    />
`;

const LazyImage = { render };

define('hybrids-lazy-image', LazyImage);
```
{%endraw%}

If you joined us for our posts on [lit-element](../part-5-litelement/) and
[Gluon](../part-6-gluon/), you'll notice a few similarities and a few glaring
differences to our previous `<lazy-image>` implementations.

Like `LitElement` and `GluonElement`, hybrids use an `html` template literal
tag function to generate their template objects. You can interpolate data into
your template's children or their properties, map over arrays with template
returning functions and compose templates together, just like we've seen
previously. Indeed, on the surface hybrids and lit-html look very similar. But
beware - here be dragons. While hybrids' templating system is inspired by
libraries like `lit-html` and `hyper-html`, it's not the same thing. You can
read more about the specific differences to lit-html at [hybrids' templating
system docs](https://hybrids.js.org/template-engine/overview). For our
purposes, we need to keep two big differences from `lit-html` in mind:

1. Bindings are primarily to properties, not attributes. More on that in a bit.
2. Event listeners are bound with `on*` syntax (e.g. `onclick`,
   `onloaded-changed`) and take the host element, rather than the event, as
   their first argument, so the function signature is `(host: Element, event:
   Event) => any`.

Since Hybrids emphasizes pure functions, we can extract the `onLoad` handler to
the root of the module. Even though its body references the element itself,
there's no `this` binding to worry about! We could easily unit test this
handler without instantiating our element at all. Score!

Notice also that we're importing a `dispatch` helper from `hybrids` to make
firing events a little less verbose.

In our previous implementations, we used a `loaded` attribute on the host
element to style the image and placeholder, so why are we using `class` on them
now?

### Hybrids Prefers Properties to Attributes

Hybrids takes a strongly opinionated stance *against* the use of attributes in
elements' APIs. Therefore, there's no way to explicitly bind to an attribute of
an element in templates. So how did we bind to the `aria-hidden` attribute
above?

When you bind some value `bar` to some property `foo` (by setting `<some-el
foo="${bar}">` in the template), Hybrids checks to see if a property with that
name exists on the element's prototype. If it does, hybrids assigns the value
using `=`. If, however, that property doesn't exist in the element prototype,
Hybrids sets the attribute using `setAttribute`. The only way to guarantee an
attribute binding is to explicitly bind a string as attribute value i.e.
`<some-el foo="bar">` or `<some-el foo="bar ${baz}">`.

Because of this, it also makes sense in Hybrids-land to not reflect properties
to attributes either (In the section on [factories](#factories) we'll discuss
an alternative that would let us do this). So instead of keying our styles off
of a host attribute, we'll just pass a class and do it that way:

```css
#placeholder ::slotted(*),
#image.loaded {
  opacity: 1;
}

#image,
#placeholder.loaded ::slotted(*) {
  opacity: 0;
}
```

### Binding to `class` and `style`

Since the `class` attribute maps to the `classList` property, hybrids handles
that attribute differently. You can pass a string, an array, or an object with
boolean values to a `class` binding.
- For strings, hybrids will use `setAttribute` to set the `class` attribute to
  that string.
- For arrays, hybrids will add each array member to the `classList`
- For objects, hybrids will add every key which has a truthy value to the
  `classList`, similar to the `classMap` lit-html directive.

So the following are equivalent:

{%raw%}
```js
html`<some-el class="${'foo bar'}"></some-el>`;  
html`<some-el class="${['foo', 'bar']}"></some-el>`;  
html`<some-el class="${{foo: true, bar: true, baz: false}}"></some-el>`;  
```
{%endraw%}

Binding to `style` is best avoided whenever possible by adding a style tag to
the element's shadow root, but if you need to bind to the element's `style`
attribute (e.g. you have dynamically updating styles that can't be served by
classes), you can pass in the sort of css-in-js objects that have become *de
rigueur* in many developer circles:

```js
const styles = {
  textDecoration: 'none',
  'font-weight': 500,
};

html`<some-el style="${styles}"></some-el>`;
```

## Property Descriptors

If we would define our element with the `LazyImage` object above, it wouldn't
be very useful. Hybrids will only call `render` when one of the element's
observed properties is set. In order to define those observed properties, we
need to add property descriptors to our object, which are simply keys with any
name other than `render`.

```js
const LazyImage = {
  alt: '',
  src: '',
  intersecting: false,
  loaded: false,
  render;
};
```

In this example, we're describing each property as simple static scalar values.
In cases like that, Hybrids will initialize our element with those values, then
call `render` whenever they are set<a href="#simple-descriptors">\*</a>. Super
effective, but kinda boring, right? To add our lazy-loading secret-sauce, let's
define a more sophisticated descriptor for the `intersecting` property.

Descriptors with real self-confidence are objects that have functions at one or
more of three keys: `get`, `set`, and `connect`. Each of those functions take
`host` as their first argument, much like the `onLoad` event listener we
defined in our template above.

### `get`

The `get` function will run, unsurprisingly, whenever the property is read. You
can set up some logic to compute the property here if you like. Avoid side
effects if you can, but if you need to read the previous value in order to
calculate the next one, you can pass it as the second argument to the function.

This simple example exposes an ISO date string calculated from an element's
`day`, `month`, and `year` properties:

```js
const getDateISO = ({day, month, year}) =>
  (new Date(`${year}-${month}-${day}`))
    .toISOString();

const DateElementDescriptors = {
  day: 1,
  month: 1,
  year: 2019,
  date: { get: getDateISO }
}
```

Hybrids will check if the current value of the property is different than the
value returned from `get`, and if it isn't, it won't run effects (e.g. calling
`render`). Reference types like Object and Array are checked with simple
equivalency, so [you should use immutable data techniques to ensure your
element
re-renders](https://open-wc.org/help/js.html#modifying-an-array-or-object-s-members-does-not-trigger-rerender).

### `set`

If you need to manipulate a value when it is assigned or even (gasp!) perform
side-effects, you can do that with `set`, which takes the `host`, the new
value, and the last value.

```js
import { targetDate } from './config.js';

const setDateFromString =  (host, value, previous) => {
  const next = new Date(value);
  // reject sets after some target date
  if (next.valueOf() < targetDate) return previous;
  host.day = next.getDate();
  host.month = next.getMonth();
  host.year = next.getYear();
  return (new Date(value)).toISOString();
}

const DateElementDescriptors = {
  day: 1,
  month: 1,
  year: 2019,
  date: {
    get: getDateISO,
    set: setDateFromString,
  }
}
```

If you omit the `set` function, hybrids will automatically add a pass-through
setter (i.e. `(_, v) => v`)<a href="#pass-through-setter">\*\*</a>.

### `connect`

So far hybrids has done away with classes and `this` bindings, but we're not
done yet. The next victims on hybrids' chopping block are lifecycle callbacks.
If there's any work you want to do when your element is created or destroyed,
you can do it on a per-property basis in the `connect` function.

Your `connect` function takes the `host`, the property name, and a function
that will invalidate the cache entry for that property when called. You could
use `invalidate` in redux actions, event listeners, promise flows, etc.
`connect` is called in `connectedCallback`, and should return a function which
will run in `disconnectedCallback`.

```js
import { targetDate } from './config.js';

/** connectDate :: (HTMLElement, String, Function) -> Function */
const connectDate = (host, propName, invalidate) => {
  const timestamp = new Date(host[propName]).valueOf();
  const updateTargetDate = event => {
    targetDate = event.target.date;
    invalidate();
  }

  if (timestamp < targetDate)
    targetDateForm.addEventListener('submit', updateTargetDate)

  return function disconnect() {
    targetDateForm.removeEventListener('submit', updateTargetDate);
  };
}

const DateElementDescriptors = {
  day: 1,
  month: 1,
  year: 2019,
  date: {
    get: getDateISO,
    set: setDateFromString,
    connect: connectDate
  }
}
```

In `<hybrids-lazy-image>`, we'll use `connect` to set up our intersection observer.

```js
const isIntersecting = ({ isIntersecting }) => isIntersecting;
const LazyImage = {
  alt: '',
  src: '',
  loaded: false,
  render,
  intersecting: {
    connect: (host, propName) => {
      const options = { rootMargin: '10px' };
      const observerCallback = entries =>
        (host[propName] = entries.some(isIntersecting));
      const observer = new IntersectionObserver(observerCallback, options);
      const disconnect = () => observer.disconnect();
      observer.observe(host);
      return disconnect;
    }
  },
};
```

### Factories

It would be tedious to have to write descriptors of the same style for every
property, so hybrids recommends the use of 'factories' to abstract away that
sort of repetition.

Factories are simply functions that return an object. For our purposes, they
are functions that return a property descriptor object. Hybrids comes with some
built-in factories, but you can easily define your own.

```js
const constant = x => () => x;
const intersect = (options) => {
  if (!('IntersectionObserver' in window)) return constant(true);
  return {
    connect: (host, propName) => {
      const options = { rootMargin: '10px' };
      const observerCallback = entries =>
        (host[propName] = entries.some(isIntersecting));
      const observer = new IntersectionObserver(observerCallback, options);
      const disconnect = () => observer.disconnect();
      observer.observe(host);
      return disconnect;
    }
  }
}

const LazyImage = {
  alt: '',
  src: '',
  loaded: false,
  intersecting: intersect({ rootMargin: '10px' }),
  render,
}
```

In this particular case the win is fairly shallow, we're just black-boxing the
descriptor. Factories really shine when you use them to define reusable logic
for properties.

For example, even though hybrids strongly recommends against the use of
attributes, we may indeed want to our elements to reflect property values as
attributes, like many built-in elements do, and like the [TAG guidelines
recommend](https://w3ctag.github.io/webcomponents-design-guidelines/#native-html-elements).
For those cases, we could write a `reflect` factory for our properties:

```js
import { property } from 'hybrids';

export const reflect = (defaultValue, attributeName) => {
  // destructure default property behaviours from built-in property factory.
  const {get, set, connect} = property(defaultValue);
  const set = (host, value, oldValue) => {
    host.setAttribute(attributeName, val);
    // perform hybrid's default effects.
    return set(host, value, oldValue);
  };

  return { connect, get, set };
};
```

Factories are one of hybrids' most powerful patterns. You can use them, for
example, to create data provider element decorators that use the hybrids cache
as state store. See the
[`parent`](https://hybrids.js.org/built-in-factories/parent-children) factory
for examples.

## Final Component

<iframe src="https://stackblitz.com/edit/hybrids-lazy-image?embed=1&amp;&amp;"
        scrolling="no" allowfullscreen allowtransparency="true" loading="lazy"
        width="100%" height="500" frameborder="no">
</iframe>

{%raw%}
```js
import { html, define, dispatch } from 'hybrids';

const style = html`
  <style>
    :host {
      display: block;
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
    #image.loaded {
      opacity: 1;
    }

    #image,
    #placeholder.loaded ::slotted(*) {
      opacity: 0;
    }
  </style>
`;

const constant = x => () => x;
const passThroughSetter = (_, v) => v;
const isIntersecting = ({isIntersecting}) => isIntersecting;
const intersect = (options) => {
  if (!('IntersectionObserver' in window)) return constant(true);
  return {
    connect: (host, propName) => {
      const observerCallback = entries =>
        (host[propName] = entries.some(isIntersecting));
      const observer = new IntersectionObserver(observerCallback, options);
      const disconnect = () => observer.disconnect();
      observer.observe(host);
      return disconnect;
    }
  }
}

const bubbles = true;
const composed = true;
const detail = { value: true };
const onLoad = host => {
  host.loaded = true;
  // Dispatch an event that supports Polymer two-way binding.
  dispatch(host, 'loaded-changed', { bubbles, composed, detail })
};

const render = ({alt, src, intersecting, loaded}) => html`
  ${style}
  <div id="placeholder"
      class="${{loaded}}"
      aria-hidden="${String(!!intersecting)}">
    <slot name="placeholder"></slot>
  </div>

  <img id="image"
      class="${{loaded}}"
      aria-hidden="${String(!intersecting)}"
      src="${intersecting ? src : undefined}"
      alt="${alt}"
      onload="${onLoad}"
    />
`;

define('hybrids-lazy-image', {
  src: '',
  alt: '',
  loaded: false,
  intersecting: intersect({ rootMargin: '10px' }),
  render,
});
```
{%endraw%}

## Summary

Hybrids is a unique, modern, and opinionated web-component authoring library.
It brings enticing features like immutable data patterns, emphasis on pure
functions, and easy composability to the table for functionally-minded
component authors. With a balanced combination of patterns from the
functional-UI world and good-old-fashioned OOP, and leveraging the standards to
improve performance and user experience, it's worth giving a shot in your next
project.

| Pros | Cons |
|-----|-----|
|Highly functional APIs emphasizing pure functions and composition|Strong opinions may conflict with your use case or require you to rework patterns from other approaches|
|Intensely simple component definitions keep your mind on higher-level concerns|Abstract APIs make dealing with the DOM as-is a drop more cumbersome|

<github-repository owner-repo="hybridsjs/hybrids"></github-repository>

Would you like a one-on-one mentoring session on any of the topics covered
here? [![Contact me on
Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Acknowledgements

Special thanks go to Dominik Lubański, Hybrids' author and primary maintainer,
for generously donating his time and insight while I was preparing this post,
especially for his help refactoring to an idiomatic hybrids style.

<a name="simple-descriptors">\*</a>Actually what hybrids does here is generate simple descriptors for you, in order to ensure that property effects are run, etc.
<a name="pass-through-setter">\*\*</a>As of original publication, the behaviour of adding pass-through setters when `set` is omitted is not yet released.

<small>2020-10-31: edited vanilla example</small>

[part-6]: ../part-6-gluon
