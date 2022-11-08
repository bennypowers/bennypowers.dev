---
title: You Should be Using esm
description: esm lets you seamlessly combine cjs and js modules with little fuss, if you're transpiling just to use import, chances are you shouldn't.
published: true
datePublished: 2018-09-16
tags:
  - javascript
  - esm
  - es6
---

## tl;dr:

You can use JavaScript modules in node today without transpiling, just `npm -S
esm` and run your app with `node -r esm foo.js`. add `"esm": "auto"` to the top
level of your package.json to make loading modules and cjs in the same app
effortless and transparent.

If you've stuck around this far, keep reading for an opinionated history of how
we've come to this point.

- [The History](#the-history)
- [Transpiling](#transpiling)
- [The Problem](#the-problem)
- [`esm`: A Better Solution](#esm-a-better-solution)

## The History

Historically, JavaScript was browser-only. Developers used a number of
techniques to structure their code, all of which were basically abstractions
over global variables. Among those solutions, a crowd-favourite called CommonJS
(or 'cjs') emerged.

```js
const { foo } = require('./bar')

const baz = foo + "qux"

module.exports = {
  quux: [baz]
}
```

CJS gained traction among JS developers mostly because it was the module system
that NodeJS used. Front-end developers could *bundle* cjs-based apps with tools
like [webpack][webpack] into single-file scripts that browsers could load and
run.

The notion that one codebase could (with a certain amount of tool-wrangling)
run on the server as well as the client lead to things like server-side
rendering, NativeScript/React Native and the proliferation of tools like
webpack, [babel](http://babeljs.io/), and others as **non-negotiable**
prerequisites to JS development.

In 2015, ECMAScript version 6 was published, which included a syntax for
language-level modules.

```js
import { foo } from './bar.js'

const baz = foo + "qux"

export const quux = [baz]
```

These modules were static and top-level-only, meaning you couldn't do things
like the following.

```js
const moduleName = "foo" + "bar"
if (baz) {
  // nope!
  import { quz } from moduleName
}
```

Which CJS users had become used to. On the other hand, js modules were
statically analyzable, meaning that a new breed of tools like
[Rollup](https://www.rollupjs.com/guide/en) could analyze the js files to do
useful things like tree-shaking, which is a process that removes unused code
from bundles. This helped developers to ship less code which made sites load
faster for users.

<aside>

Side note: a [proposal for dynamically imported modules][dynamic-import] has
made it to stage 3 and is already available in [a number of
browsers][caniuse-di]

</aside>

The specifics of how modules would be loaded and module graphs (logical
structures representing the functional relationship between modules) were left
to implementers, i.e. browser vendors and the node maintainers.

Browser vendors took the lead and wrote up the [loader
specification][loader-spec], but the situation for node, which already had a
module system, was more complex, and as of today, [no final plan has
emerged][node-esm-status-blog], although they are close.

## Transpiling

When the ES2015 spec (then called ES6 or "harmony") was published, a project
called 5-to-6, later renamed Babel, came along as a way to let JS programmers
write their apps using the awesome new ES6 features, while shipping code that
older browsers and Internet Explorer could support.

This process of translating one language or version of a language to another is
called *transpiling*, a portmanteau of *trans*lating and com*piling.

Babel has since evolved into a sort of JavaScript Swiss army knife. It can take
a variety of JavaScript versions or even separate languages entirely and whip
them into code that runs in the browser.

## The Problem

Babel has done tremendous good for web developers. It's enabled new or proposed
features to be explored *en masse* before they were implemented by browsers,
which helped expose edge cases with those features, leading to better
specifications. It also played a huge part in the sea change which web
development is currently undergoing from an OOP/Proceedural paradigm to a more
functional paradigm. Babel also forms the basis for a wide variety of tools and
products available to web developers today...

...but it doesn't have to, and that can sometimes be a bit of a problem.

### The Cost of Transpiling

Developer Jamie K. put it nicely: 

[![size comparison of transpilation methods][transpilation] ![The three browsers holding JavaScript back the most are...](/assets/images/jamiebuilds-esm-tweet.png)][ie11-tweet]

https://twitter.com/jamiebuilds/status/1022568918949408768

The business case for delivering a large, one-size-fits all bundle to modern
browsers and ie8 alike is rapidly eroding. Modern techniques like [differential
serving](https://github.com/Polymer/prpl-server-node) let us serve optimized,
slimmed-down ES2018 to capable browsers, while reserving bloated, transpiled
bundles for those less-so. Beyond that, for apps where IE11 support is not an
absolute business necessity, it would actually be irresponsible to support that
old, insecure browser, when users can and should be using the latest and
greatest.

### Principles and Cognitive Load

In the node world, transpiling comes with its costs as well. Maintaining a
babel configuration isn't always the simplest task. More than that, though,
transpiling subtly communicates that "this code isn't ok by itself, it needs
extra processing to be OK", and we shouldn't want to say that about native
modules, even if CJS had a head start.

## `esm`: A Simple Solution

`esm` is an excellent package by Microsoft developer [John-David
Dalton](https://github.com/jdalton) of lodash fame, *et al*. It's a module
loader that transforms es modules at run time instead of transpiling them. 

With `esm`, the elusive 'interop' Just Works™. You can mix and match native and
CJS modules without batting an eye. 

You can even use most command line node apps! For example, the excellent
[`tape`](https://github.com/substack/tape) testing library doesn't come with
module support out of the box, but you can easily add it like so:

```bash
npx tape -r 'esm' './**/*.test.js'
```

## Summary

Next time you have a node.js project, before you start writing a babel config
just to transpile modules, give `esm` a try.

[dynamic-import]: https://github.com/tc39/proposal-dynamic-import
[caniuse-di]: https://caniuse.com/#feat=es6-module-dynamic-import
[webpack]: https://webpack.js.org/
[loader-spec]: https://whatwg.github.io/loader/
[node-esm-status-blog]: https://medium.com/@giltayar/native-es-modules-in-nodejs-status-and-future-directions-part-i-ee5ea3001f71
[transpilation]: https://res.cloudinary.com/practicaldev/image/fetch/s--hXSditKx--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://pbs.twimg.com/media/DjDYksXUYAAAy22.jpg
[ie11-tweet]: https://twitter.com/jamiebuilds/status/1022568918949408768
