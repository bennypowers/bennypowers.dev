---
title: 'Lets Build Web Components! Part 8: MythBusters Edition'
description: Web Components are awesome, but perhaps a little misunderstood. This post dispels many myths which have cropped up recently.
published: true
datePublished: 2019-02-19
cover_image: https://thepracticaldev.s3.amazonaws.com/i/qgc03cib7p603aph0o76.png
tags:
  - web components
  - custom elements
  - javascript
  - html
  - mythbusters
---

So far in this series, we've covered the underlying web components
[standards][part-1], the legacy-browser [polyfills][part-2], and their
implementation with [vanilla javascript][part-3] and a [wide][part-4]
[variety][part-5] of [different][part-6] helper [libraries][part-7].

Today, we're going to review some pernicious myths about web components and
their use which seem to have cropped up lately. Many of these misconceptions
are understandable, considering how young the technology is, and how the shift
from the `v0` web components spec to `v1` with its wide adoption has changed
the landscape considerably, and for the better.

Let's shine a little light on the web's own component model and learn how they
make development easier and improve the experience of users, developers, and
managers.

- [Myth: Web Components Aren't Supported By
  Browsers](#myth-web-components-arent-supported-by-browsers)
- [Myth: Web Components Can't Accept Complex
  Data](#myth-web-components-cant-accept-complex-data)
- [Myth: Web Components Have No Way Of
  Templating](#myth-web-components-have-no-way-of-templating)
- [Myth: Web Components Can't be
  Server-Side-Rendered](#myth-web-components-cant-be-serversiderendered)
- [Myth: Web Components are a Proprietary Google
  Technology](#myth-web-components-are-a-proprietary-google-technology)
- [Myth: You Need Polymer to Use Web
  Components](#myth-you-need-polymer-to-use-web-components)
- [Myth: You Need to Use HTML Imports](#myth-you-need-to-use-html-imports)
- [Myth: You Need to Use Shadow DOM](#myth-you-need-to-use-shadow-dom)
- [Myth: You Need Frameworks to Write
  Apps](#myth-you-need-frameworks-to-write-apps)
- [Myth: You Can't Use Web Components in
  Frameworks](#myth-you-cant-use-web-components-in-frameworks)
- [Myth: The Web Community Has Moved on From Web
  Components](#myth-the-web-community-has-moved-on-from-web-components)

## Myth: Web Components Aren't Supported By Browsers

Sometimes a picture is worth 1024 words:
<figure>

![Browser Table illustrating full web components support in Chrome, Opera, Safari, and Firefox, with Polyfill support on Edge, and full support in development on Edge](https://thepracticaldev.s3.amazonaws.com/i/n44vascg9dclyk6u7h7s.png)

  <figcaption>
  This screenshot was taken from https://webcomponents.org with Firefox version 65.0.1 in February 2019. It shows that all major browsers support web components specifications, with Edge soon-to-deliver support sans-polyfills. <small>(Web Components can also be made to be supported down to IE11, but [you shouldn't do that](https://tech.slashdot.org/story/19/02/09/050208/please-stop-using-internet-explorer-microsoft-says))</small>
  </figcaption>
</figure>

But isn't the proof of the pudding in the eating... or... the proof of the
platform <abbr title="Application Programmer Interface">API</abbr> in the
deploying? If web components were not supported, we wouldn't expect to see them
in the wild, and certainly not in use by large teams. However:
[Twitter](https://twitter.com/maxlynch/status/1072587492749180928), GitHub,
[dev.to](https://github.com/thepracticaldev/dev.to/pull/1524), McDonalds,
[Salesforce](https://developer.salesforce.com/docs/component-library/documentation/lwc),
[ING](https://tweakimg.net/files/upload/spreakrik.pdf) (PDF link),
[SAP](https://sap.github.io/ui5-webcomponents/), and many others all use web
components in public-facing, core-business pages. In my day job at
[Forter](https://forter.com), we use web components. In fact, in 2018, [10% of
all reported Chrome page loads used web
components](https://twitter.com/slightlylate/status/1088173570046480384).

https://twitter.com/slightlylate/status/1088173570046480384

Clearly, web components are not just a potentially-interesting future
technology. They are in use, by you and users like you, on the web *today*.

[![Myth: Busted][busted]](#)

## Myth: Web Components Can't Accept Complex Data

I've seen the claim recently that web components are limited to accepting their
data as strings, and therefore can't take complex objects. This misconception
is particularly insidious because, like any good lie, it's half true. This
misguided notion stems from a fundamental misunderstanding of the <abbr
title="Document Object Model">DOM</abbr> and how it works.

Here follows a brief review. Feel free to <a href="#string-attr-debunk">Skip
it</a> if you're OK with DOM vs. <abbr title="HyperText Markup
Language">HTML</abbr> / attrs vs. props.

```html
<input id="text-input" placeholder="Enter Your Text"/>
```

HTML Elements and attributes are part of the HTML specification, and roughly
form the `D` part of the `DOM` or Document Object Model. In the example above
the `<input>` element has two attributes, `id` with the value "text-input" and
`placeholder` with the value "Enter Your Text". Since HTML documents are by
definition strings and only strings, both the attribute names and their values
are strings and only strings.

When the browser parses a document, it creates JavaScript objects corresponding
to each HTML element, initializing some of that object's properties with the
values found at the corresponding attributes. This tree of objects comprises
the `OM` in `DOM`. Properties exist on JavaScript objects.

Here's a pseudocode example of the DOM node for our input:

```js
Object HTMLInputElement {
  tagName: 'INPUT',
  placeholder: 'Enter Your Text',
  id: 'text-input'
  ...
}
```

Strictly speaking, elements can have attributes but they can't have properties,
because elements are part of a document, not a DOM tree. What I mean by that is
that the DOM for a given page is not the same as the HTML for that page;
rather, the DOM is *derived* from the HTML document.

You can inspect any DOM node's properties in the dev tools elements/inspector
panel. Chrome shows all DOM properties in the `properties` tab (look next to
CSS rules), Firefox shows them under the `Show DOM Properties` context menu.
You could also evaluate `$0` while inspecting a node, or use the DOM APIs, e.g.
`document.querySelector('my-element').someProp`;

In the case of our fledgling input, the DOM object's `id` property is
`text-input`.

```js
const input = document.getElementById('text-input');

console.log(input.id);                  // 'text-input'
console.log(input.getAttribute('id'));  // 'text-input'

input.id = 'by-property';
console.log(input.getAttribute('id'));  // 'by-property'

input.setAttribute('id', 'by-attribute');
console.log(input.id);                  // 'by-attribute'
```

For many attribute/property pairs, changes to one are reflected in the other,
but not for all of them. For example, an `HTMLInputElement`'s `value` property
represents the *current* value, whereas the `value` attribute only represents
the *initial* value.

<a name="string-attr-debunk"></a>
*Back to our story*

It seems some developers have reasoned thus:
1. Attributes can only be strings
1. HTML elements only have attributes and no properties
1. Custom Elements are HTML elements
1. Therefore web components can only accept strings in attributes

This reasoning would hold in a world where everyone disables JavaScript 100% of
the time, but we don't live in such a world. In our world, the DOM is a rich
and well-utilized part of the web platform.

Custom Elements are indeed HTML elements tied to the document, but they are
also DOM nodes, swinging from the branches of the DOM tree. They can have
semantic **string** attributes, but they can also accept complex nested
**data** as properties, using JavaScript and the DOM.

Here's an example of how you might accomplish that using only the DOM API:

```js
const input = document.createElement('country-input');
input.countries = [
  {name: 'Afghanistan', dialCode: '+93', countryCode: 'AF'},
  {name: 'Albania', dialCode: '+355', countryCode: 'AL'},
  /* ... */
];
```

So - do web components only accept strings? Poppycock! Balderdash! Flimshaw!
The full expressive power of the DOM is available to your custom elements from
day one.

[![Myth: Busted][busted]](#)

And if you think you're limited to using the bare DOM APIs to set those
properties... think again!

## Myth: Web Components Have No Way Of Templating

Like the previous myth, this misconception has one foot in the truth. The most
widely adopted web component spec is the [`<template>` element, used for
efficient static
templating](https://dev.to/bennypowers/lets-build-web-components-part-1-the-standards-3e85#template-elements),
and it's available across all evergreen browsers. The type of templating I want
to talk about in this post uses what you might call "dynamic templates" or
templates with variable parts.

{%raw%}
```html
<template id="person-template">
  <figure>
    <img alt="{{picture.alt}}" src="{{picture.src}}"/>
    <figcaption>{{name}}</figcaption>
  </figure>
</template>
```
{%endraw%}

We'll start by discussing some proposed features, then show some examples you
can run today.

[Template
Instantiation](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
is a proposed web components spec that offers a future means to define DOM
templates with slots for dynamic content. It will hopefully soon let us write
declarative templates for our custom elements. The following maquette
illustrates how that might look in practice:

{%raw%}
```html
<template type="with-for-each" id="list">
  <ul>
    {{foreach items}}
      <li class={{ type }} data-value={{value}}>{{label}}</li>
    {{/foreach}}
  </ul>
</template>

<script>
const list = document.getElementById('list');

customElements.define('awesome-web-components', class extends HTMLElement {
  #items = [
    { type: 'description', value: 'awesome', label: "Awesome!!" },
    { type: 'technology', value: 'web-components', label: "Web Components!!" }
  ];

  template = list.createInstance({ items: this.#items });

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this.template);
  }

  set items(items) {
    this.#items = items;
    this.template.update(items);
  }

  get items() {
    return this.#items;
  }
});
</script>
```
{%endraw%}

<aside>

Note, I'm purposefully handwaving over the implementation of `with-for-each`
here. This example is only to whet the appetite. See the
[proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
for more.

</aside>

Template Instantiation will be *hella*-useful when it lands, but at the moment,
we need to rely on libraries.

Does that mean that web components have no way of templating? Preposterous!
There are a variety of approaches and libraries available, from
[lit-html](https://lit-html.polymer-project.org),
[HyperHTML](https://github.com/WebReflection/hyperHTML), or
[hybrids](https://hybrids.js.org); to [slim.js](https://slimjs.com) or
[svelte](https://svelte.technology/), and more.

A few examples to illustrate the point:

### Templating with lit-html

```js
import { LitElement, html } from 'lit-element';

const itemTemplate = ({ value, label, type }) => html`
  <li class=${type} data-value=${value}>${label}</li>`

customElements.define('awesome-web-components', class extends LitElement {
  items = [/* ... */]
  render() {
    return html`<ul>${items.map(itemTemplate)}</ul>`;
  }
});
```

### Templating with hybrids

```js
import { define, html } from 'hybrids';

const itemTemplate = ({ value, label, type }) => html`
  <li class=${type} data-value=${value}>${label}</li>`;

define('awesome-web-components', {
  items: { get: () => [/*...*/] },
  render: ({ items }) => html`<ul>${items.map(itemTemplate)}</ul>`
});
```

### Templating with Slim.js

{%raw%}
```js
import { Slim } from 'slim-js';
import { tag, template } from 'slim-js/Decorators';
import 'slim-js/directives/repeat.js'

@tag('awesome-web-components')
@template(`
<ul>
  <li s:repeat="items as item"
      bind:class="item.type"
      bind:data-value="item.value">
    {{ item.label }}
  </li>
</ul>`)
class MyTag extends Slim {
  onBeforeCreated() {
    this.items = [/*...*/]
  }
}
```
{%endraw%}

### Templating with Svelte

{%raw%}
```html
<ul>
  {#each items as item}
    <li class="{item.type}" data-value="{item.value}">{item.label}</li>
  {/each}
</ul>

<script>
  export default {
    data() {
      return {
        items: [/*...*/]
      }
    }
  }
</script>
```
{%endraw%}

It's worth mentioning at this point that some of these examples illustrate
approaches that use build-time transpilation to render your templates (svelte
in particular). But you aren't limited to that; hybrids, lit-element, and
others run dynamic templates in the browser. You could paste the lit-element
example (with some small modifications to resolve bare module specifiers) into
the browser console and it would work.

With many of the various templating methods, you can also declaratively pass
complex data as properties:

{%raw%}
```js
import { html } from 'lit-html';
const propPassingTemplate = html`
  <takes-complex .data=${{ like: { aTotal: ['boss'] } }}></takes-complex>`;
```
{%endraw%}

So, can you write dynamic, declarative templates? Web components offer a
straightforward templating story, without the hard requirement of a
transpilation step. Moreover, there are plenty of different opinionated
approaches in the ecosystem with more appearing as these standards gain
notoriety.

[![Myth: Busted][busted]](#)

## Myth: Web Components Can't be Server-Side-Rendered

Server-side rendering is a technique whereby client-side javascript (or
something like it) is executed on the server when a request comes in,
generating an initial response containing content that would otherwise be
unavailable until the aforementioned client-side code was downloaded, parsed,
and executed. There are, generally speaking, two reasons why you would
implement server-side rendering:

1. To make your app's pages indexable by search engines that might not run
   JavaScript
1. To reduce the time to [first contentful
   paint](https://developers.google.com/web/tools/lighthouse/audits/first-contentful-paint)

Can you accomplish these goals in a web-components app? *Indubitably*.

You can use Google's puppeteer (which runs headless Chrome or Firefox on your
server) to render the contents of your components for the sake of web crawlers.
The inimitable [captaincodeman](https://www.captaincodeman.com/) has a
[fully-realized example of <abbr title="server side
rendering">SSR</abbr>-for-<abbr title="search engine
optimization">SEO</abbr>](https://github.com/CaptainCodeman/appengine-ssr)
written in Go.

So there are ways to run your custom elements-based client side JS on the
server for SEO purposes. What about reducing load times?

Well, it seems that the jury is out regarding whether or not running your
templates server-side is faster in the first place. If the goal is to reduce <a
href="https://developers.google.com/web/tools/lighthouse/audits/first-contentful-paint"><abbr
title="first contentful paint">FCP</abbr></a> times, you might instead opt to
calculate your data at request time, while factoring your client-side app with
a lightweight static app shell. In this flavour of SSR, you have some
server-side code which computes an initial state, *à la* this example from an
[Apollo Elements](https://dev.to/bennypowers/announcing-apollo-elements-5777)
GraphQL app:

```js
async function ssr(file, client) {
  // Instantiate a version of the client-side JS on the server.
  const cache = new InMemoryCache();
  const link = new SchemaLink({ schema: server.schema, context });
  const client = new ApolloClient({ cache, link, ssrMode: true });

  // Calculate the initial app state.
  await client.query({ query: initialQuery });
  const serializedState = JSON.stringify(client.extract());

  // Inject said state into the app with a static `<script>` tag
  const dom = await JSDOM.fromFile(file);
  const script = dom.window.document.createElement('script');
        script.innerHTML =
          `window.__APOLLO_STATE__ = ${serializedState}`;

  dom.window.document.head.append(script);

  // Send the modified index.html to the client
  return dom.serialize();
}

app.get(/^(?!.*(\.)|(graphi?ql).*)/, async function sendSPA(req, res) {

  // SSR All the Things
  const index = path.resolve('public', 'index.html');
  const body = await ssr(index, client);

  // 👯‍♀️👯‍♂️
  res.send(body);
});
```

Doing the same for a different state container like redux is left as an
exercise for the reader. (or, like... [google
it](https://redux.js.org/recipes/server-rendering))

You'll note that none of this code is specific to web components or any
specific templating library. When your components upgrade and connect to their
state container, they'll get their properties and render according to whatever
the implementation.

There's a lot more to say on this issue, and the story will only improve in the
near term, as the lit-html team have prioritized work on SSR for 2019. I don't
mind telling you, dear reader, that I'm not an expert. Give [Trey
Shugart](https://twitter.com/treshugart), [Kevin P
Schaaf](https://twitter.com/kevinpschaaf), and [Justin
Fagnani](https://twitter.com/justinfagnani) a follow if you want the low-down.

So, can you SSR all the things in your web components app? Well, don't expect
any turn-key solutions here. It's early days, and the cowpaths are still quite
fresh. Nonetheless, basic facilities are in use in production today, and
there's a lot to look forward to coming up soon. But is it possible? Sure!

**<abbr title="too long; didn't read">tl;dr</abbr>**: the techniques and
libraries are still very early, but it's certainly possible to accomplish the
goals of SSR in wc-based apps.

All right, I'm calling it.

[![Myth: Busted][busted]](#)

## Myth: Web Components are a Proprietary Google Technology

While the modern web components story began at Google (at a secret seance in
the basement of one of their datacenters, I'm told 👻), it's grown beyond the
bounds of any one company.

To wit:
- The [HTML Modules
  proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/html-modules-proposal.md)
  was taken up by Microsoft.
- The [Template Instantiation
  proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
  was tabled by Apple. (For the yanks, 'tabled' means 'offered for
  consideration')
- The VSCode Team is leading the charge to [standardize IDE tools for web
  components](https://github.com/w3c/webcomponents/issues/776).
- [`open-wc`](https://open-wc.org) (caveat: I'm a contributor) is a community
  project not associated with any of the big players.

Web Components specs are open standards with multiple implementations and
stakeholders.

[![Myth: Busted][busted]](#)

## Myth: You Need Polymer to Use Web Components

This is a fun one. Back in the dark ages of 2013, the only way to use 'web
components' was to use the polymer library, which back then functioned as a
combination polyfill/templating system/build tool/package manager/kitchen sink.
The reason for this was simple: The Polymer Project invented the modern notion
of web components, and the Polymer library (version 0) was their prototype
implementation.

Since then, things have changed *drastically*. The polyfills split off from the
Polymer library and its opinionated templating system years ago, and are now in
use by many independent projects.

If this is news to you, give a quick read to the first part of my [Polymer
Library post](..part-4-polymer-library/#the-polymer-project), which clarifies
the difference between the Polymer Project and the Polymer Library.

So, no, you don't need Polymer to use web components. You don't even need the
Polyfills if you're only supporting evergreen browsers (minus Edge until
Edgeium ships)

Want proof? Open a new tab in Chrome, Firefox, or Safari and paste this snippet
into the console:

```js
customElements.define('the-proof', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>:host { display: block; }</style>
      You just used web components without Polymer
    `;
  }
});

document.body.innerHTML = `
  <the-proof>You Can't use web components without Polymer!!</the-proof>
`;
```

**<abbr title="too long; didn't read">tl;dr</abbr>**: The
[polyfills](https://github.com/webcomponents/webcomponentsjs) are independent,
and the Polymer project even recommends *not* using the Polymer library for new
projects.

[![Myth: Busted][busted]](#)

## Myth: You Need to Use HTML Imports

One of the things that drew me in to web components back in 2015 was the notion
of writing sophisticated components in HTML files. The now-defunct HTML Imports
specification let us do just that, and here's how it looked:

```html
<link rel="import" href="/my-component.html">
<my-component></my-component>
```

HTML Imports struck a chord with many developers, as it signalled a return to a
document-centric approach to web development, as opposed to the 'modern',
script-centric approach, to which many of us find ourselves obliged nowadays.
That's why, for many of us in the web components community, it was bittersweet
when the HTML Imports specification was deprecated in favour of modules.

Yup, you read that right. **HTML Imports are not a
thing.**[<sup>1</sup>](#endnote-1)

Nowadays, web component and app authors are most likely to use JavaScript
modules to package and import their components:

```html
<script type="module" src="/my-component.js"></script>
<my-component></my-component>
```

This approach opens the door to the huge assortment of tooling options we have
out there, and means **you don't need to use Polymer tools for your projects.**

But you're not limited to modules either:
[`<good-map>`](https://github.com/keanulee/good-map) is a vanilla web component
wrapper for Google Maps which is distributed as a script instead of as a
module. If you visit that repo, and I hope you do, don't be alarmed by the
(optional) legacy HTML import, or by the fact that the last update was two
years ago, the web components specs mean it [still works just
fine](https://stackblitz.com/edit/good-map-example).

{% glitch 'good-map-example' %}

**<abbr title="too long; didn't read">tl;dr</abbr>**: Not only are HTML Imports
*unnecessary*, but you actually *shouldn't* use them in your projects.

[![Myth: Busted][busted]](#)

## Myth: You Need to Use Shadow DOM

This is one of the easiest myths to bust. Used GitHub lately? You've used web
components without Shadow DOM. Open a tab to https://github.com in your
favourite evergreen browser and paste this snippet in the console:

```js
const isCustomElement = ({ tagName }) => tagName.includes('-');
const usesShadowDom = ({ shadowRoot }) => !!shadowRoot;
const allElements = Array.from(document.querySelectorAll('*'))
console.log("All Custom Elements", allElements.filter(isCustomElement));
console.log("Uses Shadow Dom", allElements.filter(usesShadowDom));
```

Shadow DOM is the secret sauce of web components and I highly recommend you use
it to the fullest extent. However, there are times when you might not want to
encapsulate all of a component's styles against the rest of the
document[<sup>2</sup>](#endnote-2). For those instances, it's simple to avoid
the use of Shadow DOM - just don't opt in!

Here's a simple copypastable example:

```js
customElements.define('without-shadow', class extends HTMLElement {
  constructor() {
    super();
    // no call to `this.attachShadow`
    this.innerHTML = `<p>A Custom Element Without Shadow DOM</p>`
    this.style.color = 'rebeccapurple';
  }
});

document.body.innerHTML = `<without-shadow></without-shadow>`;
```

So, while I think you *should* use Shadow DOM, it's nice to know that you don't
*have to*.

[![Myth: Busted][busted]](#)

## Myth: You Need Frameworks to Write Apps

You might have heard tell that "web components are great for leaf nodes like
buttons, but you need frameworks to build *real* apps" or some such argument.
It's certainly the case that if you're building a leaf node like a checkbox or
a card, web components are the hands-down favourite (see [next
myth](#myth-you-cant-use-web-components-in-frameworks)), but what you might not
know is that you can indeed build entire apps with them.

I built a [demo app](http://lit-apollo-subscriptions.herokuapp.com/) using
Apollo GraphQL and web components that scores well in lighthouse. Then there's
the [pwa-starter-kit](https://pwa-starter-kit.polymer-project.org/) example
app. It uses web components with redux[<sup>3</sup>](#endnote-3) to manage
state, has client-side routing, integration tests, and all that app-y goodness.
At Forter, we're building prototypes and internal apps without frameworks, and
the results so far are very positive.

And there are many more examples. (Ever wonder which JS framework GitHub uses?)

Now, I happen to think it's just as wrong-headed to say you should never use
frameworks as it is to say that you always need one. There's nothing inherently
wrong with frameworks. A Framework *might be* the right choice for your
project, but don't let anyone ever tell you that you *need* one to write web
apps.

**<abbr title="too long; didn't read">tl;dr</abbr>**: Frameworks are great, but
they're not absolute requirements, even for cutting edge workflows.

[![Myth: Busted][busted]](#)

## Myth: You Can't Use Web Components in Frameworks

This one's a quicky. All it takes to dispel it is 10 seconds scrolling through
https://custom-elements-everywhere.com

Even the frameworks with the worst custom elements support are slowly but
surely working on improving the situation, and workarounds are available.

**<abbr title="too long; didn't read">tl;dr</abbr>**: Web components 💓 love 💓
frameworks.

[![Myth: Busted][busted]](#)

## Myth: The Web Community Has Moved on From Web Components

If you've read the whole post up till now, you might be scratching your head
thinking "isn't this obvious?" And yet, judging by the amount of internet noise
claiming that <abbr title="web components">WC</abbr> is dead, it bears some
fleshing out.

![Mark Twain reclining with a Pipe. Caption reads: "Reports of my Death Have
Been Greatly
Exaggerated"](https://thepracticaldev.s3.amazonaws.com/i/q8tycwjyznocq8fy6mmy.jpg)

We've already seen how organizations large and small are shipping web
components. We've seen how you yourself probably used web components on popular
websites within the last hour. We've seen how >10% of page loads across all
browsing sessions load a page with a custom element in it. *And all of that is
just the beginning.*

In 2018, there was a veritable Cambrian Explosion of new ideas and shipped code
in the web components world - from [Firefox shipping full support in version
63](https://blog.nightly.mozilla.org/2018/09/06/developer-tools-support-for-web-components-in-firefox-63/)
to [Edge announcing
intent-to-ship](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/shadowdom/?q=shadow),
to innovative library releases like hybrids and
[haunted](https://github.com/matthewp/haunted) (think React hooks for web
components), to projects like [Angular
Elements](https://angular.io/guide/elements) which improve the already
formidable interop story between elements and frameworks. We're not talking
about browser-implementers pontificating from behind their compilers! As we've
seen above, there's been tremendous adoption from developers themselves at
companies large and small, and among community volunteers.

So what should we make of the sometimes-insistent voices who claim that "web
components just aren't there yet?"

![Domestic Cat Wearing a Lion Mane. Caption: "I'm a Lion
Roar!!!!!!!"](https://thepracticaldev.s3.amazonaws.com/i/jtpjp1fqdslrisjbtjrp.jpg)

[![Myth: Busted][busted]](#)

## Conclusion

If you've been waiting for web components to "arrive" before trying your hand
at them, I'm giving you permission right now. It's an exciting time to be a web
developer, and the future is only looking brighter.

Web components let us write and publish reusable pieces of web content and
compose modular apps with increasingly small dependency and tool chains. If you
haven't given this refreshing style of development a try, I hope you will soon.

## Acknowledgements

Many people helped me write this post, and I'm very grateful.

Thanks in no particular order for generously offering their notes on this post
go to [westbrook](https://dev.to/westbrook), [Dzintars](https://dev.to/oswee),
[stramel](https://dev.to/stramel89), Thomas, tpluscode, and Corey Farell on the
Polymer Slack; as well as lars, [Passle](https://dev.to/thepassle), and
[daKmoR](https://dev.to/dakmor) from the `open-wc` team; Dan Luria (who
described this post as a 'brunch cocktail - both delightful and progressively
more challenging') on the WeAllJS slack; my good friend Justin Kaufman; and my
dear wife Rachel.

## Endnotes

1. <a name="endnote-1"></a> Stay tuned, because the days of writing HTML-in-HTML are returning with the <a href="https://github.com/w3c/webcomponents/blob/gh-pages/proposals/html-modules-proposal.md">HTML Modules Proposal</a>. [<small>back</small>](#myth-you-need-to-use-html-imports)
1. <a name="endnote-2"></a> Most of the time, you'll want to use the `<slot>` element for this use case. The zero-shadow-DOM approach is best suited when, for whatever reason, you find your project unable to make use of the shadow DOM polyfill. [<small>back</small>](#myth-you-need-to-use-shadow-dom)
1. <a name="endnote-3"></a> Don't like Redux or Apollo? Use a different (MobX, et al.), or no (mediator or meiosis patterns) state container - you have options. [<small>back</small>](#myth-you-need-frameworks-to-write-apps)

[part-1]: ../part-1-the-standards/
[part-2]: ../part-2-the-polyfill/
[part-3]: ../part-3-vanilla-components/
[part-4]: ../part-4-polymer-library/
[part-5]: ../part-5-litelement/
[part-6]: ../part-6-gluon/
[part-7]: ../part-7-hybrids/
[busted]: https://thepracticaldev.s3.amazonaws.com/i/cmbqv6ouo4amho06kev4.png
