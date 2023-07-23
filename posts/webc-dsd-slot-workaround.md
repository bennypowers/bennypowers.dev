---
title: WebC Declarative Shadow DOM Slot Workarounds
published: true
description: |
  A cheeky hack to make &lt;slot> elements work as expected in
  11ty's WebC framework.
datePublished: 2023-17-23
coverImage: /assets/images/webc-slot-workaround.png
coverImageAlt: spider's web with a large gap in the center
tags:
  - eleventy
  - webc
  - opinion
  - web components
---

I wrote earlier this year about WebC, the new framework for templating HTML in
11ty. WebC's standards-aligned approach is refreshing and encouraging, and my
conclusion was that it's support for the real-deal web components standards
needs some polishing.

Since then I've been working on porting the docs site for [Apollo Elements][ae] 
to WebC. Some of WebC's design choices make it harder to use web components APIs 
as they are "intended", or at least as I interpret the spec's intent. In 
particular, support for Declarative Shadow DOM is still in what I'd call a 
preliminary state. [WebC provides some examples of <abbr title="declarative 
  shadow dom">DSD</abbr> components][examples] on their github account, but the
examples provided don't cover normal DSD use with `<slot>` elements.

## WebC's "slot" vs Web's "slot"

As of WebC version 0.11.4, the framework provides two different kinds of 
`<slot>` elements to developers that work in very different ways. Developers 
will have to choose between using WebC's non-standard `<slot>` component, which 
transfers content from component children to the shadow root, and native 
`<slot>` elements, which project content from the light DOM to the shadow root. 
In order to get the native behaviour, developers will have to add the 
`webc:keep` attribute to their `<slot>` elements; if they don't, instead of 
getting a native slot, they'll get a "compiler portal" which moves content from 
the host document to the element's shadow DOM.

The distinction is subtle but critical, and might lead to developer confusion. 
So consider this WebC component:

```html
<!--- web-see.webc --->
<template shadowrootmode="open">
  <style>
    p { color: red; }
    ::slotted(*) { color: blue; }
  </style>
  <p>Shadow!</p>
  <slot></slot>
</template>
```

Now let's apply this component to a page and slot in some content.

```html
<web-see>
  <p>Light!</p>
</web-see>
```

What colour should the word "Shadow!" be? What colour the word "Light!"?
[MDN][mdn-slot] leads us to believe that our slotted content would appear in the
document, and that our [`::slotted`][mdn-slotted] rule would apply to the 
slotted content. "Shadow!" should be red, "Light!" should be blue.

WebC's `<slot>` server component (remember: not the same as the web platform's 
`<slot>` element) will however cause the light content to be *moved*  from the 
document into the shadow root. The `::slotted` selector will no longer apply, 
the content will not be accessible from the light DOM. "Shadow!" will be red.

```html
<web-see>
  <template shadowrootmode="open">
    <style>
      p { color: red; }
      ::slotted(*) { color: blue; }
    </style>
    <p>Shadow!</p>
    <p>Light!</p>
  </template>
</web-see>
```

More importantly, I was unable to use the native `<slot>` element at all in DSD
templates. The 11ty build hung and eventually crashed with a heap overflow. WebC
provides some features like `webc:raw`, but that doesn't work consistently here.

## Solving the problem

I'm certain that WebC's DSD support will improve over time, and I'm confident
that it will eventually take a more standards-first approach to `<template>` and
`<slot>` elements, especially once Mozilla implements the spec. In the mean
time though, what can we do in userland to solve the problem? Well, we can
side-step the framework altogether:

```html
<!--- web-see.webc --->
<template shadowrootmode="open">
  <style>
    p { color: red; }
    ::slotted(*) { color: blue; }
  </style>
  <p>Shadow!</p>
  <!--- <slot></slot> --->
  <webc-dsd-slot-workaround></webc-dsd-slot-workaround>
</template>
```

By replacing our `<slot>` element with this silly tagname, we can go back after
the fact in eleventy's `addTransform` API, and use parse5 to replace all those 
workarounds with native slots:

<figure>

  ```js
  eleventyConfig.addTransform('webc-dsd-slot-workaround', async function(content) {
    if (this.page.outputPath?.endsWith?.('.html')) {
      const { transform } = await import('./transform.js');
      return transform(content);
    }
  });
  ```

  ```js
  import { parse, serialize } from 'parse5';
  import { isElementNode, isTemplateNode, queryAll } from '@parse5/tools';

  const isShadowRootMode = attr =>
    attr.name === 'shadowrootmode';
  const isWorkaround = node =>
    isElementNode(node) && node.tagName === TAG_NAME;
  const isDSDTemplate = node =>
    isTemplateNode(node) && node.attrs?.find(isShadowRootMode);

  export function transform(content) {
    const document = parse(content)
    for (const template of queryAll(document, isDSDTemplate)) {
      const { content } = template;
      for (const node of queryAll(content, isWorkaround)) {
        node.tagName = 'slot';
      }
    }
    return serialize(document);
  }
  ```

  <figcaption>
    For each output HTML file:
    <ol>
      <li>parse the file with parse5</li>
      <li>get all the DSD template nodes</li>
      <li>find all the template content's children which are slot workarounds</li>
      <li>change the tag name to <code>slot</code></li>
    </ol>
  </figcaption>
</figure>

And so, with one ugly hack, we restore the native behaviour. When WebC's support
improves, we'll have to do a project find-and-replace and remove our 11ty
transform, but that's it.

I hope this workaround is helpful to you and I look forward to updating this
post with news of improved DSD support in WebC.

[ae]: https://apolloelements.dev
[examples]: https://github.com/11ty/demo-webc-shadow-dom/blob/main/_components/sample-component-dsd.webc
[mdn-slot]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
[mdn-slotted]: https://developer.mozilla.org/en-US/docs/Web/CSS/::slotted
