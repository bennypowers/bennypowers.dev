---
title: Let's Build a Colour Picker Web Component
description: |
  Build and accessible, web-native colour picker component that works in any 
  framework with the web components APIs.
published: true
datePublished: 2021-06-09
coverImage: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/01rg22y3j3s2bw61t8w9.png
coverImageAlt: |
  screenshot of JavaScript code for colour picker element with demo of element 
  running
tags:
  - web components
  - html
  - javascript
  - css
  - lit
---

Let's build a colour picker web component using HTML, CSS, and a little bit of
JavaScript. In the end, we'll have a custom element that:

- Displays a colour spectrum using [CSS Gradients][css-gradients]
- Tracks the mouse position using a [Reactive Controller][reactive-controller]
- Updates it's [Shadow DOM][shadow-dom] via a small class mixin
- Fires a [Custom Event][custom-event] when the user clicks or drags

## Prerequisites

To get the most out of this article, you should have a comfortable
understanding of HTML, CSS, and JavaScript; including:

- How to [load resources with `<link>`][link-tag]
- Basic [CSS syntax][css-syntax]
- How to use the [DOM API][dom] to query for elements
- [Object-oriented programming][oop] for web developers and the [JavaScript 
  `class` keyword][es-class]
- What a [JavaScript module][es-module] is

You don't need to be an expert, but you should have the basics covered. You
should also be familiar with the concept of component-based UI design and have
an idea of what a web component is. If you've ever written a component with one
of the popular JS frameworks, you're good to go. To catch up on what web
components are, check out my blog series:

[Let's Build Web Components! Part 1: The Standards][part-1]

## Setting Up

Before we define our component, let's set up a project folder to work in and
spin up a quick dev server to reload the page when we save a file. Paste the
following script into a BASH terminal on a computer that has [nodejs and 
npm][node] installed:

```bash
mkdir ~/color-picker
cd ~/color-picker
touch index.html
touch style.css
touch mouse-controller.js
touch color-picker.js
touch color-picker.css
npx @web/dev-server --open --watch
```

These commands create a working directory in your `HOME` folder with some empty
files, then start an auto-reloading development server. Next, open the newly
created folder in your text editor of choice and edit the index.html file,
adding this snippet:

```html
<!doctype html>
<head>
  <link rel="stylesheet" href="style.css"/>
  <script type="module" src="color-picker.js"></script>
</head>
<body>
  <color-picker></color-picker>
</body>
```

And let's put some initial styles in `style.css`

```css
color-picker {
  width: 400px;
  height: 400px;
}
```

We don't see anything on screen yet, since we haven't defined the
`<color-picker>` element. Let's do that now.

## Defining our Element

Web components (or custom elements) are HTML elements that we the users define.
Let's define the `<color-picker>` element by extending from the `HTMLElement`
class. Open `color-picker.js` and add this code:

```js
const template = document.createElement('template');
      template.innerHTML = `
        <link rel="stylesheet" href="color-picker.css">
        <div id="loupe"></div>
      `;

class ColorPicker extends HTMLElement {
  constructor() {
    super()
    this
      .attachShadow({ mode: 'open' })
      .append(template.content.cloneNode(true));
  }
}

customElements.define('color-picker', ColorPicker);
```

Let's take that file block-by-block.

We start by declaring a `<template>` element to hold our element's HTML. We'll 
add a link to our component's [private CSS](#styling-our-component) and two 
nested `<div>` elements that we'll use later on to enhance our component. By 
using a `<template>`, we make sure the browser does the work of parsing our HTML 
only one time, when the page loads. From then on, we can create as many 
`<color-picker>` elements as we want, but each one will stamp a clone of the 
existing HTML, which is [much faster than parsing it again][template-perf].

Next we declare our custom element class. In the constructor, we attach a 
[ShadowRoot][shadow-root] to our element, then stamp the contents of the 
template we created into it.

Last, we call `customElements.define()`, which assigns the HTML tag name 
`<color-picker>` to custom element class, and instructs the browser to upgrade 
the `<color-picker>` elements already present in the document.

If you save the file, the dev server will reload the page, but we still won't 
see any changes because our element's content is invisible. Let's change that by 
applying some good-old CSS.

## Styling our Element

Open up `color-picker.css` and paste in the following.

```css
:host {
  display: block;
  min-height: 100px;
  min-width: 100px;
  cursor: crosshair;
  background:
    linear-gradient(to bottom, transparent, hsl(0 0% 50%)),
    linear-gradient(
      to right,
      hsl(0 100% 50%) 0%,
      hsl(0.2turn 100% 50%) 20%,
      hsl(0.3turn 100% 50%) 30%,
      hsl(0.4turn 100% 50%) 40%,
      hsl(0.5turn 100% 50%) 50%,
      hsl(0.6turn 100% 50%) 60%,
      hsl(0.7turn 100% 50%) 70%,
      hsl(0.8turn 100% 50%) 80%,
      hsl(0.9turn 100% 50%) 90%,
      hsl(1turn 100% 50%) 100%
    );
}

#loupe {
  display: block;
  height: 40px;
  width: 40px;
  border: 3px solid black;
  border-radius: 100%;
  background: hsl(var(--hue, 0) var(--saturation, 100%) 50%);
  transform: translate(var(--x, 0), var(--y, 0));
  will-change: background, transform;
}
```

We'll get into the details of our CSS rules shortly ([skip 
ahead](#color-picker-styles)). For now, save the file to see our changes on the 
page. That's more like it. Now our element looks like a colour picker!

### Shadow CSS Q-and-A

If you're unfamiliar with web components, you might be asking yourself some 
questions at this point:

#### `:host`

> What the heck is `:host`

The [`:host` CSS selector][host-selector] gets the element that hosts the root 
containing the stylesheet. If that doesn't make any sense to you, don't worry, 
we'll explain more shortly. For now, all you need to know is that in this 
context, `:host` is synonymous with the `color-picker` element itself.

#### ID Selectors (e.g. `#loupe`)

> ID selectors!? Aren't they a huge CSS no-no?

In the [cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity), 
ID selectors have an extremely high specificity, which means they'll override 
rules with a lower specificity like classes or element selectors. In traditional 
(global) CSS, this can very quickly lead to unintended consequences.

https://stackoverflow.com/questions/8279132/why-shouldnt-i-use-id-selectors-in-css

Our stylesheet isn't global though, since we `<link>` to it from within a 
`ShadowRoot` instead of from the document, the styles are strongly scoped to 
that root. The browser itself enforces that scoping, not some JavaScript 
library. All that means the styles we define in `color-picker.css` can't 'leak 
out' and affect styles elsewhere on the page, so the selectors we use can be 
very simple. We could even replace that `#loupe` selector with a bare `div` 
selector and it would work just the same.

The shadow root encapsulation also means that the element IDs we're using in our 
template HTML are private. Go ahead and try this in the browser console:

```js
document.getElementById('loupe');
```

Without shadow DOM, we should see our `<div id="loupe"></div>` element in the 
console, but we don't. Shadow DOM puts us in complete<sup><a 
href="#inherited-styles">*</a></sup> control of our component's HTML and CSS, 
letting us put whatever HTML and CSS we want inside it without worrying about 
how they affect the rest of the page.

#### CSS-in-JS, BEM, etc.

> If this is supposed to be a reusable component, won't those styles and IDs
> affect the page? Shouldn't we use BEM, or add JavaScript or a command-line
> tool to transform those IDs into  unique random class names?

Now that we've learned a little more about Shadow DOM works, we can answer that 
question for ourselves: The Shadow DOM (supported in all browsers) removes the 
need for complicated css-in-js tooling or class naming conventions like BEM. We 
can finally write simple, à la carte selectors in CSS, scoping our work to the 
task at hand.

### Color Picker Styles

Equipped with our knowledge of the Shadow DOM, let's dive into our element's 
styles.

The business-end of our element's `:host` styles is a pair of 
`linear-gradient()` calls, one which fades from transparent to grey, the other 
which turns [360 degrees around the colour wheel][hsl] in 10% increments as it 
moves from the far left of our element to the far right. We also threw in a 
cross-hair cursor and some default dimensions for good measure.

Our `#loupe` rule gives our colour-picking [loupe][loupe] a pleasing circular 
shape, but - crucially - defines its background-color and position in terms of 
[CSS Custom Properties][css-vars] also called *CSS Variables*. This is going to 
come in handy in the next step when we use JavaScript to animate the loupe 
element. We also nod to the browser, letting it know that the `background` and 
`transform` properties are likely to change.

## Tracking the Mouse with a Reactive Controller

Every component needs HTML, CSS, and JavaScript to handle properties, events, 
and reactivity. We covered HTML and CSS with `<template>`, `ShadowRoot`, and 
`:host`. Now let's move on to reactivity, meaning to update our element's 
state-of-affairs in reaction to some input like user actions or changing 
properties.

### Reusable, Composable Controllers

Oftentimes when writing components, we come across a bit of logic or behaviour 
that repeats itself in multiple places. Things like handling user input, or 
asynchronously fetching data over the network can end up in most if not all of 
the components in a given project. Instead of copy-pasting snippets into our 
element definitions, there are better ways to share code across elements.

[JavaScript class mixins][js-mixins] are a time-tested way to share code between 
components. For example you might have a component which fetches a file based on 
it's `src` attribute. A `FetchSrcMixin` would let you write that code in one 
place, then reuse it anywhere.

```js
class JSONFetcher extends FetchSrcMixin(HTMLElement) {/*...*/}
class TextFetcher extends FetchSrcMixins(HTMLElement) {/*...*/}
```
```html
<json-fetcher src="lemurs.json"></json-fetcher>
<text-fetcher src="othello.txt"></text-fetcher>
```

But mixins have a limitation - they have an 'is-a-*' relationship to their 
element class. Adding a mixin to a class means that the result _is_ the 
combination of the base class and the mixin class. Since mixins are functions, 
we can compose them with [function composition][func-comp], but if one of the 
composed mixins overrides a class member (e.g. field, method, accessor), there 
could be trouble.

To solve this problem, the [Lit][lit] team recently released a new "composition 
primitive" called [Reactive Controllers][reactive-controller], which represent a 
'has-a-*' relationship. A controller is a JavaScript class that contains a 
reference to the host element, which must implement a certain set of methods 
called the `ReactiveControllerHost` interface.

In plain terms, that means you can write a controller class and add it to any
element class that meets certain criteria. A controller host can have multiple
independent or interdependent controllers, a controller instance can have one
host, controllers can independently reference shared state.

If you're familiar with React hooks, you might recognize the pattern that
controllers fit. The downside to hooks though is that you can only use them
with React.

Similarly, the downside to controllers vs mixins is that they require their
host element class to fulfill certain criteria, namely: the class must
implement the `ReactiveControllerHost` interface.

|             | Composable | Reusable | Stackable | Independent |
| ----------- | ---------- | -------- | --------- | ----------- |
| Mixins      | ✅         | ⚠️        | ❌        | ✅          |
| Controllers | ✅         | ✅       | ✅        | ❌          |

Unlike React, though, controllers can be made to work with components from 
different frameworks or custom element classes other than `LitElement`. 
Controllers can work with [React][rc-react], [Angular][rc-ng], [Vue][rc-vue], 
[Haunted][rc-haunted], and others by virtue of some clever glue-code.

In my [Apollo Elements][apollo-elements] project, I wrote some reactive 
controllers that do GraphQL operations like [queries][apollo-queries] and 
[mutations][apollo-mutations]. I wanted to use those controllers in any custom 
element, so I decided to solve that problem with a class mixin called 
`ControllerHostMixin`. By applying it to an element's base class, it adds the 
bare-minimum required to host a reactive controller. If you apply it to a base 
class that already implements the `ReactiveControllerHost` interface, it defers 
to the superclass, so you could safely (if pointlessly) apply it to 
`LitElement`.

## Adding Controller Support to our Element

Let's update (controller pun!) our element to accept controllers. Open
`color-picker.js` and replace the contents with the following:

```js
import { ControllerHostMixin } from 'https://unpkg.com/@apollo-elements/mixins@next/controller-host-mixin.js?module';

const template = document.createElement('template');
      template.innerHTML = `
        <link rel="stylesheet" href="color-picker.css">
        <div id="loupe"></div>
      `;

class ColorPicker extends ControllerHostMixin(HTMLElement) {
  constructor() {
    super()
    this
      .attachShadow({ mode: 'open' })
      .append(template.content.cloneNode(true));
  }

  update() {
    super.update();
  }
}

customElements.define('color-picker', ColorPicker);
```

Whoa what's that? We're loading the `ControllerHostMixin` over the internet
from a CDN, no `npm` required!

This time, when you save the file and the page reloads, it will take a moment
before you see the colour picker, while the page loads the necessary files from
unpkg. Subsequent reloads should be faster, thanks to the browser cache. Go
ahead and save `colour-picker.js` again to see what I mean.

Now that we're set up to host reactive controllers, let's add one which tracks
the position and state of the mouse. Open `mouse-controller.js` and add the
following content:

```js
export class MouseController {
  down = false;

  pos = { x: 0, y: 0 };

  onMousemove = e => {
    this.pos = { x: e.clientX, y: e.clientY };
    this.host.requestUpdate();
  };

  onMousedown = e => {
    this.down = true;
    this.host.requestUpdate();
  };

  onMouseup = e => {
    this.down = false;
    this.host.requestUpdate();
  };

  constructor(host) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('mousemove', this.onMousemove);
    window.addEventListener('mousedown', this.onMousedown);
    window.addEventListener('mouseup', this.onMouseup);
  }

  hostDisconnected() {
    window.removeEventListener('mousemove', this.onMousemove);
    window.removeEventListener('mousedown', this.onMousedown);
    window.removeEventListener('mouseup', this.onMouseup);
  }
}
```

Notice how this module has no imports of its own. Controllers don't have to 
bundle any dependencies, they can be as simple as a single class in a single 
module, like we have here. Notice also where we reference the `host` element:

- in the `constructor` by calling `addController()` to register this as one of 
  the element's controllers
- in `hostConnected` and `hostDisconnected` to run our setup and cleanup code
- in our MouseEvent handlers, calling `host.requestUpdate()` to update the host 
  element

That `host.requestUpdate()` call is especially important, it's how reactive 
controllers inform their hosts that they should re-render. Calling it kicks off 
an asynchronous pipeline which includes a call to the host's `update()` method. 
Read @thepassle 's [formidable deep dive into the LitElement 
lifecycle][lit-deep-dive] for more details.

Let's add the `MouseController` to our element and use `console.log` to observe 
updates. in `color-picker.js`, import the controller:

```js
import { MouseController } from './mouse-controller.js';
```

Then add it to the element's class:

```js
mouse = new MouseController(this);

update() {
  console.log(this.mouse.pos);
  super.update();
}
```

<details><summary>Full source</summary>

```js
import { ControllerHostMixin } from 'https://unpkg.com/@apollo-elements/mixins@next/controller-host-mixin.js?module';

import { MouseController } from './mouse-controller.js';

const template = document.createElement('template');
      template.innerHTML = `
        <link rel="stylesheet" href="color-picker.css">
        <div id="loupe"></div>
      `;

class ColorPicker extends ControllerHostMixin(HTMLElement) {
  mouse = new MouseController(this);

  constructor() {
    super()
    this
      .attachShadow({ mode: 'open' })
      .append(template.content.cloneNode(true));
  }

  update() {
    console.log(this.mouse.pos);
    super.update();
  }
}

customElements.define('color-picker', ColorPicker);
```

</details>

After saving, when you move the mouse around the screen, you'll see the mouse' 
position logged to the console. We're now ready to integrate the 
`MouseController`'s reactive properties into our host element.

### Hooking up the Cursor

We'd like our `#loupe` element to move with the mouse cursor, and for it's 
background color to reflect the colour under the cursor. Edit the `update()` 
method of our element like so, making sure *not to forget the `super.update()` 
call*:

```js
update() {
  const x = this.mouse.pos.x - this.clientLeft;
  const y = this.mouse.pos.y - this.clientTop;
  if (x > this.clientWidth || y > this.clientHeight) return;
  const hue = Math.floor((x / this.clientWidth) * 360);
  const saturation = 100 - Math.floor((y / this.clientHeight) * 100);
  this.style.setProperty('--x', `${x}px`);
  this.style.setProperty('--y', `${y}px`);
  this.style.setProperty('--hue', hue);
  this.style.setProperty('--saturation', `${saturation}%`);
  super.update();
}
```

In short, we get the mouse position from the controller, compare it to the 
element's bounding rectangle, and if the one is within the other, we set the 
`--x`, `--y`, `--hue`, and `--saturation` CSS custom properties, which if you 
recall, control the `transform` and `background` properties on our `#loupe` 
element. Save the file and enjoy the show.

## Firing Events

Ok, we've done the lion's share of the work, all we have left to do is 
communicate with the outside world. We're going to use the browser's built-in 
message channel to do that. Let's start by defining a private `#pick()` method 
that fires a custom `pick` event, and we'll add a `color` property to our 
element to hold the most recently selected colour.

```js
color = '';

#pick() {
  this.color = getComputedStyle(this.loupe).getPropertyValue('background-color');
  this.dispatchEvent(new CustomEvent('pick'));
}
```

Let's listen for click events in our element, and fire our pick event.

```js
constructor() {
  super()
  this
    .attachShadow({ mode: 'open' })
    .append(template.content.cloneNode(true));
  this.addEventListener('click', () => this.#pick());
}
```

Add some user feedback by changing the loupe's border colour:

```css
#loupe {
  /* ... */
  transition: border-color 0.1s ease-in-out;
}
```

Let's also let the user scrub around the picker with the mouse down, we'll add 
some conditions to our update function, right before the super call:

```js
this.style.setProperty('--loupe-border-color', this.mouse.down ? 'white' : 'black');
if (this.mouse.down)
  this.#pick();
```

<details><summary>Full source</summary>

```js
import { ControllerHostMixin } from 'https://unpkg.com/@apollo-elements/mixins@next/controller-host-mixin.js?module';

import { MouseController } from './mouse-controller.js';

const template = document.createElement('template');
      template.innerHTML = `
        <link rel="stylesheet" href="color-picker.css">
        <div id="loupe"></div>
      `;

class ColorPicker extends ControllerHostMixin(HTMLElement) {
  mouse = new MouseController(this);

  constructor() {
    super()
    this
      .attachShadow({ mode: 'open' })
      .append(template.content.cloneNode(true));
    this.addEventListener('click', () => this.#pick());
  }

  update() {
    const x = this.mouse.pos.x - this.clientLeft;
    const y = this.mouse.pos.y - this.clientTop;
    if (x > this.clientWidth || y > this.clientHeight) return;
    const hue = Math.floor((x / this.clientWidth) * 360);
    const saturation = 100 - Math.floor((y / this.clientHeight) * 100);
    this.style.setProperty('--x', `${x}px`);
    this.style.setProperty('--y', `${y}px`);
    this.style.setProperty('--hue', hue);
    this.style.setProperty('--saturation', `${saturation}%`);
    this.style.setProperty('--loupe-border-color', this.mouse.down ? 'white' : 'black');
    if (this.mouse.down)
      this.#pick();
    super.update();
  }

  #pick() {
    this.color = getComputedStyle(this.loupe).getPropertyValue('background-color');
    this.dispatchEvent(new CustomEvent('pick'));
  }
}

customElements.define('color-picker', ColorPicker);
```

</details>

## Accessibility

We should take our social responsibility as engineers seriously. I'm ashamed to 
admit that I treated accessibility as an afterthought when originally drafting 
this post, but hopefully this section can do something to make it better.

Let's add screen reader accessibility to our element. We'll start by giving our 
`loupe` div a `button` role and an aria-label. We could use a `<button>` as well 
with visually hidden text content, but since we've already styled things the way 
we want, I think this is an acceptable use of `role="button"`.

Let's also add a `<div role="alert">` which we'll use to announce our chosen 
colour.

```html
<link rel="stylesheet" href="color-picker.css">
<div id="loupe" role="button" aria-label="color picker"></div>
<div id="alert" role="alert" aria-hidden="true"></div>
```

Give the alert 'visually hidden' styles, since we'll be setting it's text 
content to announce our colour.

```css
#alert {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

Last thing we need to do is set the alert's text when we pick the colour.

```js
constructor() {
  // ...
  this.alert = this.shadowRoot.getElementById('alert');
}

#pick() {
  this.color = getComputedStyle(this.loupe).getPropertyValue('background-color');
  this.alert.textContent = this.color;
  this.alert.setAttribute("aria-hidden", "false");
  this.dispatchEvent(new CustomEvent('pick'));
}
```

And we're good, screen readers will now announce the chosen colour.

## Using our Colour Picker

With our custom element finished, let's hook it up to the document by listening 
for the `pick` event. Edit `index.html` and add an `<output>` element to display 
our picked colour and an inline script to listen for the `pick` event. Let's 
also add some global styles in `style.css`:

```html
<color-picker></color-picker>
<output></output>
<script>
  document
    .querySelector('color-picker')
    .addEventListener('pick', event => {
      document
        .querySelector('output')
        .style
        .setProperty('background-color', event.target.color);
    });
</script>
```

```css
output {
  display: block;
  width: 400px;
  height: 120px;
  margin-top: 12px;
}
```

## Next Steps

Well we're done! We've met all our goals from above with a few extras laid on 
top. You can play with a live example on Glitch:

{% glitch 'controller-host-mixin-color-picker', 'app' %}

You can also follow along with the steps by tracing the commit history on 
GitHub:

<github-repository owner-repo="bennypowers/controller-host-color-picker"></github-repository>

Can you improve on the design? Here are some ideas to get your gears turning:

- Display the picked colour in HEX, HSL, or RGB
- Use the picker in a popover menu
- Add a lightness slider
- Implement WCAG contrast checking
- Use alternate colour spaces
- Keep the loupe always within the colour picker area
- Animate the cursor
- Build a magnifying loupe element that wraps graphics elements
- Optimize the runtime performance or bundle size
  - How would you rewrite MouseController if you knew that an arbitrary
    multiple number of components in your app would use it?

Show us what you come up with in the comments. If you're looking for a 
production-ready colour picker element, check out @webpadawan's 
[`<vanilla-colorful>`][vanilla-colorful].

## Footnotes

### Inherited Styles

While Shadow DOM does provide strong encapsulation, inherited CSS properties are 
able to 'pierce' the shadow boundary, so things like `color`, `font-family`, and 
any CSS custom properties can reach down into our shadow roots and style our 
private shadow DOM.

[css-gradients]:       https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient()
[reactive-controller]: https://lit.dev/docs/composition/controllers/
[shadow-dom]:          https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM
[custom-event]:        https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
[link-tag]:            https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[css-syntax]:          https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps/Getting_started
[dom]:                 https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model
[oop]:                 https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_JS 
[es-class]:            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/class
[es-module]:           https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[part-1]:              ../lets-build-web-components/part-1-the-standards/
[node]:                https://nodejs.org/
[shadow-root]:         https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
[template-perf]:       https://www.measurethat.net/Benchmarks/Show/5430/0/different-ways-template-vanilla-js-innerhtml-to-create#latest_results_block 
[host-selector]:       https://developer.mozilla.org/en-US/docs/Web/CSS/:host()
[hsl]:                 https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl()
[loupe]:               https://www.wikiwand.com/en/Loupe
[css-vars]:            https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[js-mixins]:           https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
[func-comp]:           https://www.wikiwand.com/en/Function_composition
[lit]:                 https://lit.dev
[rc-react]:            https://www.npmjs.com/package/@lit-labs/react#user-content-usecontroller
[rc-ng]:               https://stackblitz.com/edit/angular-ivy-uuiqpj?file=src%2Fapp%2Fangular-controller-host.ts
[rc-vue]:              https://stackblitz.com/edit/vue-qniewc?file=src%2Fcomponents%2FHelloWorld.vue
[rc-haunted]:          https://hauntedhooks.netlify.app/docs/hooks/usecontroller/
[apollo-elements]:     https://apolloelements.dev
[apollo-queries]:      https://apolloelements.dev/api/core/controllers/query/
[apollo-mutations]:    https://apolloelements.dev/api/core/controllers/mutation/
[lit-deep-dive]:       https://dev.to/open-wc/litelement-a-deepdive-into-batched-updates-3hh
[vanilla-colorful]:    https://github.com/web-padawan/vanilla-colorful
