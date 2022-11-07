---
title: 'Lets Build Web Components! Part 4: Polymer Library'
published: true
date: 2018-10-14
description: Learn how to build web components and factor apps with the OG web-components library, Polymer.
cover_image: https://thepracticaldev.s3.amazonaws.com/i/4bxajms0ls9ro6jiy6sk.png
tags:
  - web components
  - custom elements
  - javascript
  - polymer
  - html
  - Let's Build Web Components!
---

Component-based <abbr title="user interface">UI</abbr> is all the rage these
days. Did you know that the web has its own native component module that
doesn't require the use of any libraries? True story! You can write, publish,
and reuse single-file components that will work in
any[\*](https://caniuse.com/#feat=shadowdomv1) good browser and [in any
framework](https://custom-elements-everywhere.com/) (if that's your bag).

In our [last
post](https://dev.to/bennypowers/lets-build-web-components-part-3-vanilla-components-4on3),
we learned how to write single-file components with nothing other than
JavaScript and the <abbr title="document object model">DOM</abbr> <abbr
title="application programmer interface">API</abbr>.

Today we'll be diving in to the original web components library: Polymer. We'll
refactor the `<lazy-image>` component we built last time to take advantage of
Polymer's helpful features. We'll also learn how to compose entire apps from
Polymer-based components using their expressive templating system and two way
binding. We'll take a look at some of the fantastic ready-made paper elements
published by the Polymer team. And last, we'll survey some of the Polymer
project's helpful tools and learn how they are useful for any web-component
project, not just Polymer apps.

- [The Polymer Project](#the-polymer-project)
- [Refactoring `<lazy-image>`](#refactoring-lazy-image)
    - [Properties](#properties)
    - [Data Binding Templates](#data-binding-templates)
- [More Polymer Features](#more-polymer-features)
    - [Advanced Data Binding](#advanced-data-binding)
    - [Observers and Computed Properties](#observers-and-computed-properties)
    - [Property Descriptors](#property-descriptors)
    - [Helper Elements](#helper-elements)
- [Composing Polymer Apps](#polymer-apps)
- [Paper Elements](#paper-elements)
- [Polymer Tools](#polymer-tools)
    - [`prpl-server`](#prpl-server)
    - [Polymer CLI](#polymer-cli)
    - [WebComponents.org](#webcomponents-org)

## The Polymer Project

The [Polymer Project](https://www.polymer-project.org/) started way back in
2012/2013 with the goal of advancing the capabilities of the web platform.
[Legend has it](https://youtu.be/7CUO7PyD5zA?t=69) that deep in the bowels of
the Googleplex, a group of Chrome browser engineers convened a secret seance
with a group of web developers to map out the future course of the web at
large.

The browser engineers asked the web developers to tell them what they wanted
web dev to look like in five years' time, then they set about building it. The
result was the first release of the Polymer library and the beginning of the
modern web components story.

Since then, the Polymer Project has come full circle, such that it's now
[possible to write web components without using Polymer
Library](https://dev.to/bennypowers/lets-build-web-components-part-3-vanilla-components-4on3)
at all. But the Polymer Project is still alive and kicking. They maintain a
variety of web platform proposals and advocate for a more standards-based type
of web development than is currently popular.

The [Polymer library](https://github.com/Polymer/polymer) on the other hand has
since become only one of a number of alternatives for factoring web components
and component-based apps.

So don't confuse the two things. The **Project** is about the platform at
large, the **Library** is about helping you build components.

## Refactoring `<lazy-image>`

So let's dive in! And since we've already developed our `<lazy-image>` vanilla
component, let's use it as basis to explore Polymer as well.

Our first step in refactoring `<lazy-image>` will be to install and import the
Polymer library.

```bash
npm i -S @polymer/polymer
```

We'll also rename our component a little to help us keep our heads on straight:

```js
import { PolymerElement, html } from '@polymer/polymer'

const tagName = 'polymer-lazy-image';

class PolymerLazyImage extends PolymerElement {
  /* ... */
}

customElements.define(tagName, PolymerLazyImage)
```

Polymer 3.0 and the paper-elements require us to apply a transformation to all module specifiers, either in a build step, or as a server run-time thing. We'll use `polymer serve`, which transforms bare specifiers on the fly for us.

```bash
npm i -D polymer-cli
npx polymer serve
```

Another important step we should take now before we do any more mucking around is to call the `super` versions of all of our lifecycle callbacks.

```js
connectedCallback() {
  super.connectedCallback();
  // ...
}

disconnectedCallback() {
  super.disconnectedCallback();
  // ...
}
```

Not doing so will cause problems, since The `PolymerElement` base class needs to do work when lifecycle things happen. Work like handling the polyfills, which we don't need to do manually anymore...

```js
connectedCallback() {
  super.connectedCallback();
  this.setAttribute('role', 'presentation');
  if ('IntersectionObserver' in window) this.initIntersectionObserver();
  else this.intersecting = true;
}
```

We can lose all of the `shadowRoot`- and `ShadyCSS`-related code now, including `updateShadyStyles`, because Polymer will handle that for us. Nice! Working with libraries has taken one stress - supporting the polyfills - off our minds.

### Properties

Polymer lets you declare your element's properties statically, and I mean 'statically' in the sense of both `static get` and 'at writing time'. When you declare a property in that block, Polymer handles synchronizing attributes and properties for you. That means that when the `src` attribute on our element is set, Polymer will automatically update the `src` property on the element instance.

So now we can delete our `attributeChangedCallback`, `safeSetAttribute`, and all our getters and setters, and replace them with a static property map with some special Polymer-specific descriptors.

```js
static get properties() {
  return {
    /** Image alt-text. */
    alt: String,

    /**
     * Whether the element is on screen.
     * @type {Boolean}
     */
    intersecting: {
      type: Boolean,
      reflectToAttribute: true,
      notify: true,
    },

    /** Image URI. */
    src: String,
  };
}
```

Polymer binds to properties, not attributes by default. This means that if you bind to one of your element's properties in a host element's polymer template, it won't necessarily show up as an attribute on the element. Setting the `reflectToAttribute` boolean on a property descriptor ensures that whenever the property changes, Polymer will also set the appropriate attribute on the element. Don't worry, though, even if you declare a property with a constructor like `propName: String`, attribute changes will always update the associated property, whether or not you set `reflectToAttribute`.

**Note**: Polymer will transform camelCase property names to dash-case attribute names, and vice versa. This, by the way, is the reason why the [Polymer library actually fails some of the 'Custom Elements Everywhere' tests](https://custom-elements-everywhere.com/libraries/polymer/results/results.html).

The `notify` boolean will make your element dispatch a custom event every time your property changes. The event will be called `property-name-changed` e.g. `intersecting-changed` for the `intersecting` property, and will have as it's `detail` property an object containing the key `value` that points to the new value of your property.

```js
lazyImage.addEventListener('intersecting-changed', event => {
  console.log(event.detail.value) // value of 'intersecting';
})
```

This is the basis of Polymer's two-way binding system. It's not strictly necessary here, but we might as well expose those events, in case a user wants to bind an image's `intersecting` status up into an enclosing component.

So now we can also delete the `setIntersecting` method, since with the help of our property map and Polymer's templating system, we won't need it.

We'll have more on Polymer's property descriptors [later on](#property-descriptors).

### Data Binding Templates

We define a Polymer 3 element's templates with a static `template` getter which returns a tagged template literal.

```js
static get template() {
  return html`
    I'm the Template!
  `;
}
```

Polymer templates feature a special syntax reminiscent of handlebars or
mustache. One way (data-down) bindings are made with double-\[\[square
brackets\]\], and two-way (data-up) bindings are done with double-`{%raw%}{{{%endraw%}`curly
braces`}}`.

{%raw%}
```html
<some-input input="{{myInput}}"></some-input>

<some-element
    some-property="[[myInput]]"
    some-attribute$="[[myAttribute]]"
></some-element>
```
{%endraw%}

In this example, whenever `<some-input>` fires a `input-changed` event, the host element updates the `someProperty` property on `<some-element>`. In <abbr title="JavaScript">JS</abbr> terms, it's a simple assignment: `someElementInstance.someProperty = this.myInput`.

If you want to bind to an attribute, instead of a property, append the `$` character to the binding: whenever `myOtherProp` changes, the `some-attribute` on `<some-element>` will update: `someElementInstance.setAttribute('some-attribute', this.myOtherProp)`.

Similarly, whenever the `input-changed` custom event fires on `<some-input>`, the `myInput` property on the host component will be set to to event's `detail.value` property.

-----
In our `<polymer-lazy-image>` template, we're not using any two-way binding, so we'll stick with square brackets.

The `aria-hidden` attribute presents a small challenge. Polymer binds Boolean values to attribute with `setAttribute(name, '')` and `removeAttribute(name)`. But since `aria-hidden` must take the string literals `"true"` or `"false"`, we can't just bind it to the Boolean value of `intersecting`. The `<img/>` `src` is similarly interesting. Really, we want to set it only after the element has intersected. For that, we'll need to compute the src property on the image based on the state of the `intersecting` property.

Polymer templates can include *computed bindings*. These are bound to the return value of the chosen method.

```html
<img id="image"
    aria-hidden$="[[computeImageAriaHidden(intersecting)]]"
    src="[[computeSrc(intersecting, src)]]"
    alt$="[[alt]]"
/>
```

What's with this function-like syntax inside our binding expressions? That tells Polymer which element method to run and when. It will fire every time it's dependencies (i.e. the 'arguments passed' in the binding expression) are observed to change, updating the binding with the return value.

Note also that we're binding to the `src` *property* on the image, not it's *attribute*. That's to avoid trying to load an image at URL `"undefined"`.

```js
computeSrc(intersecting, src) {
  // when `intersecting` or `src` change,
  return intersecting ? src : undefined;
}

computeImageAriaHidden(intersecting) {
  // when `intersecting` changes,
  return String(!intersecting);
}
```

Don't be misled, though, these aren't JavaScript expressions, so you can't pass in any value you want: `[[computeImageAriaHidden(!intersecting)]]` doesn't work, neither does `[[computeImageAriaHidden(this.getAttribute('aria-hidden'))]]`

Now we'll just adjust our property map and styles slightly to account for the changes in our element's API:

```js
static get properties() {
  return {
    // ...

    /** Whether the element is intersecting. */
    intersecting: Boolean,

    /**
     * Whether the image has loaded.
     * @type {Boolean}
     */
    loaded: {
      type: Boolean,
      reflectToAttribute: true,
      value: false,
    },

  };
}
```

```html
<style>
  /* ... */
  #placeholder ::slotted(*),
  :host([loaded]) #image {
    opacity: 1;
  }

  #image,
  :host([loaded]) #placeholder ::slotted(*) {
    opacity: 0;
  }
</style>

<div id="placeholder" aria-hidden$="[[computePlaceholderAriaHidden(intersecting)]]">
  <slot name="placeholder"></slot>
</div>

<img id="image"
    aria-hidden$="[[computeImageAriaHidden(intersecting)]]"
    src="[[computeSrc(intersecting, src)]]"
    alt$="[[alt]]"
    on-load="onLoad"
/>
```

So, we were able to substantially **reduce boilerplate** in our component, and trim down some of the excess logic by including it in our template, albeit with a few somewhat tiresome computed binding helpers.

Here's our completed `<polymer-lazy-image>` module:

```js
import { PolymerElement, html } from '@polymer/polymer';

const isIntersecting = ({isIntersecting}) => isIntersecting;

const tagName = 'polymer-lazy-image';

class PolymerLazyImage extends PolymerElement {
  static get template() {
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

      <div id="placeholder" aria-hidden$="[[computePlaceholderAriaHidden(intersecting)]]">
        <slot name="placeholder"></slot>
      </div>

      <img id="image"
        aria-hidden$="[[computeImageAriaHidden(intersecting)]]"
        src="[[computeSrc(intersecting, src)]]"
        alt$="[[alt]]"
        on-load="onLoad"
      />
    `;
  }

  static get properties() {
    return {
      /** Image alt-text. */
      alt: String,

      /** Whether the element is on screen. */
      intersecting: Boolean,

      /** Image URI. */
      src: String,

      /**
       * Whether the image has loaded.
       * @type {Boolean}
       */
      loaded: {
        type: Boolean,
        reflectToAttribute: true,
        value: false,
      },

    };
  }

  constructor() {
    super();
    this.observerCallback = this.observerCallback.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Remove the wrapping `<lazy-image>` element from the a11y tree.
    this.setAttribute('role', 'presentation');
    // if IntersectionObserver is available, initialize it.
    if ('IntersectionObserver' in window) this.initIntersectionObserver();
    // if IntersectionObserver is unavailable, simply load the image.
    else this.intersecting = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectObserver();
  }

  /**
   * Loads the img when IntersectionObserver fires.
   * @param  {Boolean} intersecting
   * @param  {String} src
   * @return {String}
   */
  computeSrc(intersecting, src) {
    return intersecting ? src : undefined;
  }

  /**
   * "true" when intersecting, "false" otherwise.
   * @protected
   */
  computePlaceholderAriaHidden(intersecting) {    
    return String(intersecting);
  }

  /**
   * "false" when intersecting, "true" otherwise.
   * @protected
   */
  computeImageAriaHidden(intersecting) {
    return String(!intersecting);
  }

  /** @protected */
  onLoad() {
    this.loaded = true;
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

customElements.define(tagName, PolymerLazyImage);
```

Check out the [diff](http://www.mergely.com/ZC8tDqmJ/?ws=1&cs=1&wl=1&vp=1&rm=1) between the vanilla and Polymer versions, and see the component at work:

{% glitch 'polymer-lazy-image', 'app' %}

## More Polymer Features

Polymer has more to offer than our simple example element can easily demonstrate. A small example is the way Polymer maps all the `id`'d elements in your template to an object called `$`:

```html
<paper-button id="button">Button!</paper-button>
<paper-input id="input" label="Input!"></paper-input>
```
```js
connectedCallback() {
  console.log(this.$.button.textContent) // "Button!"
  this.$.input.addEventListener('value-changed', breakTheInternet);
}
```

### Advanced Data Binding

Polymer can also bind to host properties from non-polymer elements' events with a special syntax:

```html
<video current-time="{%raw%}{{videoTime::timeupdate}}{%endraw%}"/>
```

This means "when the `timeupdate` event fires, assign the local `videoTime` property to the video element's `currentTime`".

In a later iteration of `<polymer-lazy-image>`, we might use these kinds of bindings to synchronize internal `<img>` properties with our own.

For the low-down on Polymer's data-binding system, give [the docs](https://www.polymer-project.org/3.0/docs/devguide/data-binding) a read.

### Observers and Computed Properties

Computed properties and bindings are specialized cases of Polymer *observers*. A simple observer looks like this:

```js
static get properties() {
  return {
    observed: {
      type: String,
      observer: 'observedChanged',
    },
  };
}

observedChanged(observed, oldVal) {
  console.log(`${ observed } was ${ oldVal }`);
}
```

You can also define complex observers that take multiple dependencies or deeply observe objects or arrays.

```js
static get properties() {
  return {
    observed: Object,
    message: {
      type: String,
      value: 'A property of observed has changed',
    },
  };
}

static get observers() {
  return [
    // careful: deep observers are performance intensive!
    'observedChanged(message, observed.*)'
  ],
}

observedChanged(message, { path, value, base }) {
  // path: the path through the object where the change occurred
  // value: the new value at that path
  // base: the root object e.g. `observed`
  console.log(message, path + ': ' + value);
}
```

You can also set up computed properties, similar to computed bindings:

```js
static get properties() {
  return {
    theString: String,
    theLength: {
      type: Number,
      computed: 'computeTheLength(theString)',
    },
  };
}

computeTheLength(theString) {
  return theString.length;
}
```

In which case, `theLength` will update according to `computeTheLength` whenever `theString` changes.

These computed properties can then be bound to your template like any normal property.

```html
<span>[[theString]] has [[theLength]] characters</span>
```

Read all about Polymer observers at [the docs](https://www.polymer-project.org/3.0/docs/devguide/observers).

### Property Descriptors

We've already seen how we can set `reflectToAttribute` and `notify` to affect the outside world when our values update, and how to set up simple observers with the `observer` descriptor.

You can also set a default value with `value`, which takes either a literal value or a function.

```js
static get properties() {
  return {
    prop: {
      type: String,
      value: '🚣‍♂️'
    },

    things: {
      type: Array,
      value: () => [],
    },
  };
}
```

**Be careful!** When you want to set a default value with a reference type like `Array` or `Object`, be sure to pass a function, or else *every instance of your element* will share the same reference.

`value` assignments are set once when the component initializes, then not updated again. If you need to dynamically set properties after connecting, use [computed properties](#observers-and-computed-properties) or observers.

### Helper Elements

Polymer comes with a few helper elements that you can use in your templates to reduce the amount of imperative JavaScript you need to write. The two most commonly used are `<dom-repeat>` for iterating through lists and outputting DOM, and `<dom-if>` for conditional rendering:

```html
<!-- Will output a new article with h2 and img for each post -->
<dom-repeat items="[[posts]]" as="post">
  <template>
    <article>
      <h2>[[post.title]]</h2>
      <img src$="[[post.picture]]">
    </article>
  </template>
</dom-repeat>

<!-- Will only render it's template if conditionDepending(someProp, another) is truthy -->
<dom-if if="[[conditionDepending(someProp, another)]]">
  <template>
    I'm a very lucky textNode to have [[someProp]] and [[another]] on my side.
  </template>
</dom-if>
```

To use these helpers, make sure to import them

```js
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/polymer/lib/elements/dom-if.js';
```

For more on the helper elements, see [the Polymer docs](https://www.polymer-project.org/3.0/docs/devguide/templates).

## Composing Polymer Apps

Polymer really shines when it comes to factoring whole apps. The Polymer Project pioneered a pretty progressive and patently special (sorry) kind of declarative app structure built largely on HTML elements. The Polymer approach makes "everything an element", leveraging HTML's built-in composability. So for example, there's the `<iron-ajax>` element, which can fetch resources and expose them to Polymer's data binding.

```html
<iron-ajax auto
    url="/api/posts"
    handle-as="json"
    last-response="{%raw%}{{posts}}{%endraw%}"></iron-ajax>

<dom-repeat items="[[posts]]" as="post">
  <template>
    <article>
      <h2>[[post.title]]</h2>
      <img hidden$="[[!post.cover]]" src$="[[post.cover]]">
      [[post.body]]
    </article>
  </template>
</dom-repeat>
```

But in my humble opinion, the best example of this approach comes with the `<app-route>` element and the idea of [encapsulated routing](https://www.polymer-project.org/blog/routing):

```html
<!-- <app-shell> template -->

<!-- Capture and expose address-bar changes -->
<app-location route="{%raw%}{{route}}{%endraw%}"></app-location>

<app-route route="[[route]]"
    data="{%raw%}{{routeData}}{%endraw%}"
    tail="{%raw%}{{pageTail}}{%endraw%}"
    pattern="/:page"></app-route>

<!-- Composed routing! -->
<app-route route="[[tail]]"
    data="{%raw%}{{itemData}}{%endraw%}"
    tail="{%raw%}{{itemTail}}{%endraw%}"
    pattern="/:itemId"></app-route>

<iron-pages selected="{%raw%}{{routeData.page}}{%endraw%}" attr-for-selected="name">
  <app-master name="master"></app-master>
  <app-detail name="detail"
      item-id="[[itemData.itemId]]"
      route="[[itemTail]]"></app-detail>
</iron-pages>
```

Using app-route and iron-pages elements we have a complete routing solution
that will hide and show content based on the URL, and even pass route-related
data to those view components.

And since `<app-route>` takes it's `route` property as data, not directly tied
to `window.location`, you can pass portions of the route down to child views,
and let them manage their own internal state with their own `<app-route>`
children. Neat!

{%raw%}
```html
<!-- <app-detail> template -->
<app-route route="[[route]]"
    data="{{routeData}}"
    pattern="/:editing"></app-route>

<item-detail hidden$="[[routeData.editing]]"></item-detail>
<item-editor hidden$="[[!routeData.editing]]"></item-editor>

<paper-checkbox checked="{{routeData.editing}}">Editing</paper-checkbox>
```
{%endraw%}

What a cool concept!

<aside>

**Note** that for the sake of brevity, we're binding directly to
subproperties of `routeData` in this example, but in a real project we'd add
some helper methods to compute an intermediate `page` property from
`routeData`.

</aside>

For a fully-realised example of this type of app architecture, see the
venerable [Polymer Starter Kit](https://github.com/polymer/polymer-starter-kit)
on GitHub.

<github-repository owner-repo="polymer/polymer-starter-kit"></github-repository>

## Paper Elements

It wouldn't be a blog post on Polymer if we didn't mention the [Paper
Elements](https://www.webcomponents.org/collection/polymerelements/paper-elements),
the set of material-design UI components published by the Polymer Project. But
we'd also be making a huge mistake if we didn't get one thing super-clear:

```js
PaperElements != Polymer;
```

You can use the polymer library just fine without using the paper-elements, and
you can use the paper-elements just fine without using the polymer library!

```html
<head>
  <script type="module" src="https://unpkg.com/@polymer/paper-checkbox/paper-checkbox.js?module"></script>
  <script type="module" src="https://unpkg.com/@polymer/paper-card/paper-card.js?module"></script>
  <script type="module" src="https://unpkg.com/@polymer/paper-button/paper-button.js?module"></script>
</head>  
<body>
  <paper-card heading="Am I Checked?">
    <div class="card-content">
      Output: <span id="output">Not Checked</span>
    </div>
    <div class="card-actions">
      <paper-checkbox id="input">Check me!</paper-checkbox>
      <paper-button raised disabled id="button">Reset</paper-button>
    </div>
  </paper-card>
  <script>
    const onClick = () => input.checked = false;
    const onInput = ({detail: { value }}) => {
      output.textContent = value ? 'Checked' : 'Not Checked';
      button.disabled = !value;
    }

    input.addEventListener('checked-changed', onInput);
    button.addEventListener('click', onClick);
  </script>
</body>
```

{% glitch 'possible-yoke', 'app' %}

All we're losing here is the ability to use Polymer's data binding system. But
- you guessed it - there's an element for that, called
[`<dom-bind>`](https://www.polymer-project.org/3.0/docs/api/elements/dom-bind)

If you're looking to factor a material-design based UI with no fuss - give the
paper-elements a try.

## Polymer Tools

The Polymer Project - in addition to their advocacy work, JS and component
libraries, and standards proposals - also publish a variety of tools that help
you get your apps and components built, published, and served.

### `prpl-server`

The Chrome team developed the [PRPL
pattern](https://developers.google.com/web/fundamentals/performance/prpl-pattern/)
as a best-practice for writing and delivering performant web apps.
`prpl-server` makes it easy to serve the smallest effective bundle to capable
browsers while still supporting older browsers with larger bundles. There's a
ready made binary as well as an express middleware library. [Give it a
try](https://github.com/Polymer/prpl-server).

### Polymer CLI

The Vue CLI helps you develop Vue apps. The Angular CLI helps you develop
Angular apps. `create-react-app` helps you develop React apps.

The Polymer CLI helps you develop *web* apps.

True, it offers templates for Polymer 3 elements and apps, but that's not all.
The `polymer build` and `polymer serve` commands will build and serve any
web-component apps. Transpilation is optional. In fact, pretty much the only
thing the CLI will do to your code is replace bare module specifiers like
`import { PolymerElement } from '@polymer/polymer';` to relative URLs that the
browser can load directly.

> What!? You mean no Webpack? No Babel? No hours wrestling with config files
> and APIs that have nothing to do with my app code?

Yeah. That's exactly what I'm talking about. Next time you have an app project,
consider factoring it with web components and the Polymer CLI.

But if you *want* to transpile for older browsers (see
[`prpl-server`](#prpl-server) above), you can define a `builds` section of
`polymer.json`:

```json
{
  "root": "~/projects/my-project",
  "entrypoint": "index.html",
  "shell": "src/my-project.js",
  "sources": [
   "src/my-project.js",
   "manifest/**",
   "package.json"
  ],
  "builds": [{
      "name": "es5prod",
      "preset": "es5-bundled",
      "addServiceWorker": true
    }, {
      "name": "es6prod",
      "preset": "es6-unbundled",
      "addServiceWorker": true
    }, {
      "name": "dev",
      "addServiceWorker": false,
      "js": {"minify": false, "compile": false},
      "css": {"minify": false},
      "html": {"minify": false},
      "bundle": false,
      "addPushManifest": false
    }]
}
```

Then you just configure `prpl-server` to serve `es6prod` to modern browsers and
`es5prod` to IE and pals, and you're off to the races.

[Read them docs, doc!](https://www.polymer-project.org/3.0/docs/tools/polymer-cli)

### WebComponents.org

Before you go running off to implement that `<super-button>` you've got in
mind, why not give a search over at
[webcomponents.org](https://webcomponents.org), the largest directory of web
components. Each element is shown with its documentation, public API, and
installation method. You'll also find links to npm and github. If you're a
component author, don't hesitate! [Publish your
components](https://webcomponents.org/publish) for others to benefit from.

## Conclusions

The Polymer library was undeniably ahead of its time. It took the approach of
demanding better of the web platform and then making that a reality, instead of
just working around the platform's limitations.

Now that web components are broadly supported, does the Polymer library still have a place in our web-dev toolbox? Sure does! Some projects will naturally lend themselves to Polymer's declarative style. Some teams will discover how designers and document authors can do the work of developers with Polymer's expressive binding system.

It's not all <abbr title="sunshine">☀️</abbr> and <abbr title="roses">🌹🌹</abbr> though. As the platform and the wider web community has developed, so have the priorities of the Polymer project. Polymer 3 will probably be the last major release of the library, and likewise the 3.0 series will be the last release of the paper-elements.

So let's review some of the pros and cons of the Polymer library:

Pros|Cons
-----|-----
Expressive templating system | Can't pass JS directly to templates
Observers and computed properties, declarative event-listeners | Large dependency chain incentivizes larger Polymer-only apps
Super cool and unique approach to declarative app structure | For better or for worse, this unique declarative style is not as popular as other architectures
A mature library and component set. Tried, tested, and true | Polymer.js is all-but-deprecated, and won't receive new features unless forked

So does that mean the end for Web Components? *Heck* no! Polymer is far from the only game in town. A lightweight, declarative JS templating library called [`lit-html`](https://polymer.github.io/lit-html) and a custom-element base class that leverages it called [`LitElement`](https://github.com/polymer/lit-element) are the new hotness. God-willing, we'll cover them in our next installment.

See you then 😊

Would you like a one-on-one mentoring session on any of the topics covered here? [![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

## Acknowledgements

Thanks in no particular order to Pascal Schilp, and [@ruphin](https://github.com/ruphin) for their suggestions and corrections.

Check out the next article in the series on [LitElement](../part-5-litelement/).

