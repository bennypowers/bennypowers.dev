---
title: WebC First Impressions
published: true
description: Thoughts from my first attempt at understanding the new WebC framework from 11ty
datePublished: 2023-04-11
coverImage: /assets/images/webc-impressions.jpg
coverImageAlt: a wizard conjures web components using his staff
tags:
  - eleventy
  - html
  - opinion
  - web components
---

[`WebC`][webc] is the new-hotness component framework from [all-american web 
developer Zach Leatherman][zachleat]. It's described as a standards-based web 
component framework for <abbr title="static site generators">SSGs</abbr> like 
Zach's own [eleventy][11ty]. I've been casually following WebC news since it's 
announcement in 2022, and a [recent blog post by Bryce Wray conviced me][bryce] 
to try migrating my personal site from nunjucks templates. This post collects 
some of my initial impressions from that process.

My goal with this post is to proffer a hearty [<em 
lang="yiddish">firgun</em>][firgun] to Zach and the WebC contributors, and to 
draw attention to some of the less-stellar experiences I had, for the purposes 
of improving WebC for everyone. If the post comes off as dismissive or 
overly-negative, please attribute that to the my own lack of insight, rather 
than to the WebC authors' engineering.

👉 **<abbr title="too long; didn't read">tl;dr</abbr>:** WebC is an exciting 
technology that comes with shiny tools, but should be adopted by web component 
developers with caveats.

## Advantages
WebC's main advantages in my mind are it's mostly-`html`-ish syntax, and 
more-or-less semantically correct use of `<template>` elements.

I enjoyed the use of scoped framework attributes, where other frameworks would 
opt to squat on a set of framework attrs in the global scope.

```html
 <li for="thingy of thingies">🙄</li>
```

```html
 <li webc:for="thingy of thingies">👨‍🍳🤌 💋</li>
```

WebC as a framework at least pays lip service to web standards, which is 
incredibly refreshing, although as I'll write below I have some reservations 
about some of the details.

WebC comes preloaded with some very cool `css` and `js` bundling features, which 
help authors split up subresources into buckets that can be loaded as needed. 

WebC works with standard custom-elements and provides an opinionated set of 
guard rails and tools to allow you to register webc-defined custom elements on 
your pages.

WebC's [render templates][render-templates] are a crucial and highly flexible 
escape hatch which enable piecemeal migration in some cases and advanced 
templating features. Good stuff!

## Bugs and Missing (<abbr title="in my opinion">IMO</abbr>) Features

While porting over my [SVG sprite sheets][svg-icon] from nunjucks shortcodes to 
11ty components, I ran into some issues with host attributes and the data 
cascade

### `@attributes`
[`@attributes` is documented][attributes] to forward HTML attributes from the 
"host" element (i.e. virtual component) to the "root", but [in 
practice][attr-issue], it turns `aria-hidden="true"` into `ariahidden="true"`. 
This strikes me as a bug or oversight which I imagine the maintainers will be 
eager to fix.

### Component Data
A common pattern in nunjucks templates uses the [`{%raw%}{% set %}{%endraw%}` 
tag][set-tag] to compute some local data in scope, that can later be accessed 
elsewhere in the template. WebC has a concept of [setup scripts][setup-scripts] 
that let you compute some component-local data, but those scripts can't access 
the data cascade or the components "props".

This severely limits setup scripts usefulness compared to `set`. [hopefully the 
maintainers will take an interest in covering this case][data-issue].

#### Scoping Data to a Subtree

It would be super-cool to be able to scope a bit of data to a subtree. This 
could solve some of the needs of the previous section, by computing a prop once 
and using it within its children multiple times.

<figure>

```html
<ul @useful-prop="expensiveCalculation()">
  <li webc:for="thing in things">
    <span @html="thing.name"></span>
    <img alt="thing.alt" src="usefulProp(thing.id)">
  </li>
</ul>
```

<figcaption>
    Whoops! Can't do this! memoize your functions, or use a render template
</figcaption></figure>

It's possible to do this by creating a one-off component for the subtree, but 
that seems overkill - not everything is a component.

## Gripes

And now, the things I'm eager to be proven wrong about:

### Templating
WebC innovates a novel interpolation syntax, which is fine. To my taste, I found 
the syntax serviceable but slightly awkward. I would have prefered js template 
literal interpolation syntax like `src="${someVarInScope}"` over 
`:src="someVarInScope"`. Some editors like my preferred NeoVim can use 
treesitter to switch to ECMAScript grammar inside the interpolation sections of 
HTML attributes when `${}` is present. Using established syntax would have 
reduced cognitive and tooling load. This is, admittedly, a minor point of 
bikeshedding, and I could understand an argument like "but if it's *not* 
javascript, don't use JS syntax".

Using async data (i.e. promises) in templates can be awkward. If you pass a 
promise in as a prop, you'll have to pass it through async functions in each 
interpolation, and won't be able to rely on subsidiary properties like the 
`length` of a `Promise<Array>`. Need to toggle a class on an element if it's 
Promise-wrapped data meets a certain predicate? You can use a render template, 
move your content (i.e. the class names) to a helper function outside the 
template, or calculate your component's private state in the parent template, 
but you won't be able to `list.length > 12`, because `list` is a promise. this 
wouldn't be so bad if you could use `await` in template expressions, but you 
can't.

### Render Templates
WebC in it's current condition relies too much on [render 
templates][render-templates] if you want to do anything fancy. As I wrote above, 
these are a great feature, but for me, I prefer to stick to a single templating 
language whenever possible - this lightens the load on helpful editor features 
like treesitter highlighting and <abbr title="language server 
protocol">LSP</abbr>.

The major drawback of WebC's JavaScript render templates are that they break 
normal JavaScript semantics by eschewing `return` and `export`. Instead, render 
templates render the *last expression* found within them, a unique behaviour 
which strikes me as weird and magical.

### Setup Scripts
The way WebC setup scripts works is weird, once again breaking expectations. 
They magically assign globals to your component scope, so if you want to name 
some intermediary variables you'll have to resort to hacks like hoisting a `let` 
our of a plain block. Which brings me to my biggest, boldest question marks 
about WebC.

### Standards and Interop
A contemporary, from-scratch web framework should make it *easier* and 
*smoother* to write, bundle, and optimize the standard scoping mechanisms: 
modules and Shadow DOM. WebC's opinions seem to be directing the user in the 
opposite direction, though, back to global scope, script parsing mode, and 
global CSS.

If you want to use modules or shadow DOM in WebC you can, unlike some other 
popular web frameworks and bundling tools I could mention. WebC won't block you 
entirely,but it won't exactly help you either, and taken as a whole it seems to 
me that WebC "wants" you to keep everything in scripts and global css, and 
"punishes" you for reaching for the standard encapsulation mechanisms - es 
modules and Shadow DOM.

### Modules

As mentioned above, one of WebC's major selling points are the bundling 
features. But as of this writing, those features only work for global CSS and 
scripts, but not for Shadow DOM and modules.

If you try this render template:
```html
<script type="module" webc:type="js">
const likes = await getWebmentionLikes(mentions);
const reposts = await getWebmentionReposts(mentions);
'';
</script>
```

You'll get this error:

> Check the webc:type="js" element in ./_includes/post.webc.
> Original error message: await is only valid in async functions and the top 
> level bodies of modules (via Error)

It's hard for me to understand the thought process behind picking 
CommonJS/script parsing for a contemporary green-field web-and-JS-based 
language. Everything new should be standard modules, barring an extremely 
compelling reason. Hopefully, [Eleventy 3.0's planned support for standard 
modules][11ty-esm] will improve the situation for WebC as well.

### Shadow DOM

As someone who's built a career around standard web components, I was surprised 
to find that the `:host` selector had no effect in my WebC components. This is 
one place where compiler magic could be used to provide a standard-like 
experience where in fact standards (i.e. shadow DOM) aren't being used.

Another instance where WebC's opinions cause confusion is with `<slot>`. WebC 
will compile your slots away unless you specifically opt-out of it's 
standards-avoidance behaviour with `<slot webc:keep>`. I'd prefer to see the 
sense of `webc:keep` reversed so that users are always opting-in to magic 
features, instead of opting out to use standard features.

As WebC components are not actually web components, users should be careful when 
using `:defined`. For example, this common pattern breaks down with WebC.

```css
:not(:defined) {
  opacity: 0;
}
```

WebC's docs suggest that it's possible to output [Declarative Shadow DOM][dsd] 
templates, and indeed, if you dig around a bit, you can find an [example 
use][dsd-example]. Despite WebC authors' apparent enthusiasm for the DSD 
standard in their docs, I can't shake the feeling that they strongly recommend 
against using this new standard (at least until Mozilla implements). I'd prefer 
for DSD to be a first-class output target for WebC, with HTML templates printed 
as Shadow DOM and CSS printed into DSD templates. This is the very purpose of 
the spec, and I think a more full-throated adoption of DSD in WebC would go a 
long way to alleviating interop concerns.

#### Interop

How useful is WebC outside of 11ty, and outside of other WebC projects? Compared 
to more established web components frameworks, the emphasis here seems to be 
more on the "component" aspect and less on the "web" (as far as interops with 
other web technologies) aspect.

I'm concerned about how realistic it will be to interop between webc and other 
web components. First, not every WebC "component" is actually a custom-element, 
and in fact WebC's recommendations and guidelines seem to advise against using 
web components technologies like custom elements and Shadow DOM in most cases.

Reading the ledes of WebC docs and hype posts, you might be forgiven for 
thinking that WebC is all about writing web components, but based on my 
experiences so far, I think a fairer characterization is that WebC is a 
javascript server framework that (blessedly) isn't entirely hostile to web 
components.

## Wrapup

Although I have a lot to say about what I personally perceive as WebC's current 
lackings, please dear reader don't take that as a dismissal or criticism of WebC 
as an emerging technology. I believe the language has a really nice potential, 
and if it's stated goal of standards-based SSG authoring sometimes falls short 
in my view, it should still be lauded and encouraged. Having finished my first 
rodeo with WebC I'm confident in continuing to learn and invest in the 
technology, albeit with some caveats with regards to interop and standard web 
components.

So who is WebC for? If you're an 11ty user familiar with nunjucks, starting a 
new project with no intention of using javasscript or web components, WebC is an 
appropriate choice to adopt. If you're migrating a large njk 11ty site, perhaps 
wait for the WebC APIs to mature, or adopt it in limited and controlled areas of 
your site. If you're a web component developer, adopt WebC as a server-side 
templating language, but not (yet) as a web component framework.

-----

If you've spotted any errors or omissions in this post, or would like to prove 
me wrong about my gripes, please don't hesitate to reach out on 
[mastodon][mastodon]. I'd really like to be corrected on any misconceptions here 
in this post and will add an "errata" section for any I come across.

[webc]: https://www.11ty.dev/docs/languages/webc/
[zachleat]: https://www.zachleat.com
[11ty]: https://11ty.dev
[bryce]: https://www.brycewray.com/posts/2023/03/time-move-on-nunjucks/
[firgun]: https://www.wikiwand.com/en/Firgun
[attr-issue]: https://github.com/11ty/webc/issues/163
[data-issue]: https://github.com/11ty/webc/issues/164
[set-tag]: https://mozilla.github.io/nunjucks/templating.html#set
[svg-icon]: ../11ty-svg-sprites/
[attributes]: https://www.11ty.dev/docs/languages/webc/#@attributes
[setup-scripts]: https://www.11ty.dev/docs/languages/webc/#using-javascript-to-setup-your-component
[render-templates]: https://www.11ty.dev/docs/languages/webc/#using-javascript-to-generate-content
[11ty-esm]: https://github.com/11ty/eleventy/pull/2575
[dsd]: https://webkit.org/blog/13851/declarative-shadow-dom/
[dsd-example]: https://github.com/11ty/demo-webc-shadow-dom/blob/01a5d8c7db6df2874e28f4e050294c8607e139ba/_components/sample-component-dsd.webc
[mastodon]: https://social.bennypowers.dev/tags/11ty/
