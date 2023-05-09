---
title: Building a static storage import-map CDN
published: true
datePublished: 2023-05-09
templateEngineOverride: webc,md
coverImage: /assets/images/import-map-cdn.png
coverImageAlt: >
    at a large industrial dock, a shipping container is open, and piles of maps 
    are spilling out
tldr: >
    Import maps, the new browser standard, open up a world of possibilities for 
    factoring and optimizing web pages and experiences. In this post, we explore 
    one of them briefly: developing a static import-map-based #CDN to serve your 
    #NPM packages.
audience: >
    Standards enthusiasts, web[app] architects, design system maintainers. 
    Prereqs: working knowledge of npm, semantic versioning; familiarity with
    javascript bundlers
tags:
  - javascript
  - design systems
---
<style>
  main {
    & dt {
      font-size: 120%;
      font-weight: bold;
    }
    & dd {
      margin-inline: 0;
      margin-block-end: 1em;
    }
  }
</style>

In my day-job at Red Hat, my team are responsible for developing, promoting, and 
shipping the [Red Hat Design System][rhds]. Seen from one perspective, a design 
system is nothing more than a collection of web components, and maybe some 
guidelines on how to use them. While this is true in a narrow sense, our 
experience has shown that the *work* of building design systems involves much 
more "meta". Perhaps the lion's share of our work is taken up by our efforts to 
package up the design system for use in diverse and distinctive applications. 
After all, a design system that *only* serves a single application isn't of much 
use.

## Delivering a Design System

As work on building out the design system proceeded, and as teams were canvassed 
for interest and adoption, it became clear that just telling teams to `npm i 
@rhds/elements` was not the one-size-fits-all solution we'd hoped it would be. 
For one thing, not every team has the capability or interest to maintain a 
package.json file and associated "ecosystem" toolchain. This isn't a problem if 
you fall into the camp which holds that the final solution to UI development is 
to always use React for everything. But as it turns out there are plenty of 
capable software engineers who don't subscribe to that view. The refrain we 
heard over and over was "if we had a <abbr title="content delivery 
network">CDN</abbr> to deliver these components, it would solve so many 
problems". We found ourselves unable to disagree.

For background, a CDN is a network of web servers, usually distributed 
evenly around the globe, which provide redundant access to commonly accessed 
resources like images and scripts. For our purposes, the web-distributed and 
browser-compatible aspects of CDNs were most compelling. So when we say CDN 
here, what we're really referring to is a web service which hosts 
browser-compatible files that comprise the design system. Anyone with an HTML 
page and an internet connection can use them; no need to first install and build 
packages.

## The Requirements

Different apps have different needs, different teams have different processes. 
That reads like a dull cliche, but in large organizations, engineering leads 
have so much to keep track of just managing their own responsibilities, it's 
unreasonable to expect them to keep track of other team's requirements and 
processes as well. That's why it's advantageous for design systems teams to 
maintain a degree of independence from their user's stacks, so that no one use 
case — preeminent though it may be — can steam roll the others.

With that in mind, we set about gathering the requirements.

1st-party
: For many good reasons including security, performance, and reliability, we 
can't rely on 3rd party services.

Allowlist
: Similarly, we wanted control over which software was available on the CDN. 
While mirroring NPM was a tempting proposition at first, some brief 
consideration convinced us that opening the firehose to the world's largest 
software repository for use on a corporate CDN was maybe not the best plan.

No app
: The skills and time of our design systems team could not be taken up in app 
maintenance. There would be no PagerDuty, no <abbr title="service level 
agreement">SLA</abbr>, no weekend crises. This was non-negotiable.

Page-level control
: With a project as large as redhat.com (not to mention other design system 
users), we could not reasonably expect every page to maintain the same version 
line. As new versions of the design system would be released (particularly major 
versions), we would need to give page authors the ability to manage their own 
dependencies at the document level. This is underscored by the 
[double-registration problem][dblreg] of global custom element names.

NPM package congruency[^1]
: We knew in advance that we could not predict the fine details of every design 
system user's needs. We couldn't easily list a set of assumptions about 
packaging that would obtain in every case. For that reason we decided early on 
that we should strive to stay as close as possible to the experience of `npm 
install`ing our packages.

Package versions
: Like any design system, ours grows and evolves over time. Consuming pages 
would need to be able to target a given version or version line. The NPM 
ecosystem and associated tools rely on [semantic versioning][semver] to provide 
a measure of confidence when upgrading dependencies. We would need to serve 
multiple versions of our design systems so that users could choose the one that 
works for them.

Entrypoints and transitive dependencies
: No one cares about `tslib` 🎻. CDN users wouldn't need to extend `LitElement` 
(at least, not from our files). We wanted to provide a limited set of 
entrypoints per package, and hide the implementation details in a "vendor 
bundle" or similar solution.

<abbr title="ecmascript modules">esm</abbr>-first
: The advantages to javascript modules are many: they are automatically 
deferred, they always parse and run in strict mode, they make it much harder to 
accidentally pollute the global scope, and they can be mapped from [bare 
specifiers][importmaps]. It seemed clear to us that there was no compelling 
reason to go out of our way to support scripts when modules are better in most 
every respect.

All of these requirements led us in one direction: web standards and import 
maps.

## Import Maps on one Foot

Since their initial specification in 2015, JavaScript modules (i.e. esm) are 
able to import other modules by **absolute or relative path** or by **fully 
qualified URL**. So for example, you can write these imports in a module without 
any problems:

```js
import * as foo from '../foo.js';
import * as bar from '/bar.js';
import * as baz from 'https://qux.quux/baz.js';
```

This works a treat in many cases, but the major drawback is that you can't just 
import "a package", you have to import from a path to a particular file. 
Developers got used to referring to packages installed on their computers in 
`node_modules` directories by name, though, using what came to be called "bare 
module specifiers", like so:

```js
import * as foo from 'foo';
```

Import maps let page authors _map_ from import specifiers to module urls:

```html
<script type="importmap" webc:keep>
  { "imports": {
    "foo": "/modules/foo.js" } }
</script>

<script type="module" webc:keep>
  import * as foo from 'foo';
</script>
```

This also lets page authors *rewrite* import specifiers, for example, by 
requesting a specific version of a library

```html
<script type="importmap" webc:keep>
  { "imports": {
    "lit": "https://jspm.dev/lit@2.7.3" } }
</script>
```

## Alternatives we Considered

There are already a small but growing collection of CDNs which support modern 
esm-first workflows to varying degrees.

| Service        | Pros                                                   | Cons                                                 |
| -------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| [unpkg][unpkg] | ✅ Module-rewriting via [`?module`][unpkgqp]           | ❌ Doesn't respect entry points[^2]<br> ❌ 3rd-party |
| [jspm][jspm]   | ✅ Import Maps ❤️ <br>✅ Actively maintained            | ❌ Proprietary<br>❌ 3rd party                       |
| [esm.sh][esm]  | ✅ Self-hosted<br> ✅ Open-source<br> ✅ Import-maps ❤️ | ❌ Requires us to run an app                         |

We could have just told our users "use esbuild or rollup", but as mentioned 
above, not every user of our design system can (or should) run a nodejs / npm 
toolchain for their pages or web apps.

## The Big Idea: A Static File Bucket

In order to meet all our requirements, we decided to build a static file 
structure and ship it to Red Hat's existing CDN platform redhatstatic.com, via 
[SPAShip][spaship].

We reserved a subdir for our distribution and started dreaming up file 
structures. We new we wanted the top-level of the packages dir to be a list of 
specific package versions, and we knew we wanted each individual package to 
provide all the files listed in it's [entry points][exports] block.

<figure>
    <pre>
dx
└── v1
    └── @patternfly
        ├── elements@2.0.0
        │   ├── pf-accordion
        │   │   └── pf-accordion.js
        │   ├── pf-avatar
        │   │   └── pf-avatar.js
        │   └── ...etc
        └── elements@2.0.1
            ├── pf-accordion
            │   └── pf-accordion.js
            ├── pf-avatar
            │   └── pf-avatar.js
            └── ...etc
    <pre>
    <figcaption>Our desired file structure</figcaption>
</figure>

### Package Entry Points
A package's [entry points][entrypoints] don't have to line up with the files on 
disk. This might pose problems for our static CDN, since it's all based on 
directory structure. For example, our package `@rhds/elements` has an exports 
block that looks like this:

```json
{
  "name": "@rhds/elements",
  "version": "1.0.1",
  "description": "Red Hat Design System Elements",
  "type": "module",
  "license": "MIT",
  "exports": {
    ".": "./rhds.min.js",
    "./lib/*": "./lib/*",
    "./*": "./elements/*"
  },
}
```

This means that if you import `@rhds/elements/rh-footer/rh-footer.js`, it should 
point to `@rhds/elements@1.0.1/elements/rh-footer/rh-footer.js`, whereas if you 
import `@rhds/elements/lib/context/color/provider.js`, it will point to 
`@rhds/elements@1.0.1/lib/context/color/provider.js`.

Thankfully, an import map can manage this for us.
```html
<script type="importmap" webc:keep>
  { "imports": {
    "@rhds/elements/lib/": "/dx/v1/@rhds/elements@1.0.1/lib/",
    "@rhds/elements/": "/dx/v1/@rhds/elements@1.0.1/elements/" } }
</script>
```

## Building the Static Files

So let's get cracking. Our first problem is that we need to install multiple 
versions of the same package on the build machine, but npm typically can only 
install a single version at a time. Additionally, we'd like to separate strictly 
between the build process' dependencies and the build environment (into which we 
install and from which we build the static file structure). We chose 
[`pnpm`][pnpm] to manage our dependencies, because it's global package store 
already represents a flat list of package versions, much like our package 
directory will eventually be. We also decided to create a temporary working 
directory with a private local-only npm package, where we'd install our 
packages.

With the packages on disk, we chose [esbuild][esbuild] to bundle them up, 
while maintaining entry points.

The workflow for creating a build of the CDN looks like this:
1. Receive a comma-separated list of package version ranges
    - e.g. <code>@patternfly/elements@>=2,@rhds/elements@>=1</code>
2. Retrieve the list of concrete package versions for each of those ranges
3. For each package version from step 2:
    1. Install the package using `pnpm` (i.e. link it from the global store)
    2. Convert it's entrypoints map to a list of filepaths on disk
    3. Use `esbuild` to bundle up that list of entrypoints
        - Making sure to mark all the requested package names as `external`, so 
          that we don't end up bundling files from sibling CDN packages

That last point about external packages is important, by marking sibling 
packages as `external`, we ensure that if `@rhds/elements` depends on modules
from `@patternfly/elements`, that that file won't get bundled into the dependent 
package. In the case of custom-element definitions, that could lead to 
double-registration errors, so it's not just a performance issue.

### Sharing Code

When we run the build, we configure esbuild to output all the shared chunks to a 
common folder at the root of the CDN. Since we give chunks a hashed filename, 
and the hash is based on the file contents, we're confident that there won't be 
collisions, and we even hope that a large number of identical chunks will be 
produced across the entire build. If that were the case, more code (particularly 
common dependencies) would be shared between packages or versions.

This isn't a perfect solution, but we are confident that it's Good Enough for 
Now™.

### Generating Import Maps

The package entry point schema is more flexible than import maps, it can contain 
wildcards, whereas import maps can only specify trailing slashes which forward 
an entire directory tree. esbuild's `entryPoints` config field is the strictest 
of all, requiring a list of concrete file paths. So before we run the build, we 
have to first glob up all the files referred to in the package export map. This 
process allows us to generate an import map for each package at the same time we 
build out it's files. We make that import map available, along with some other 
metadata about the build, in a `meta.json` file at the root of the CDN.

These import maps point to absolute paths from the CDN's web root, so for 
example:

```json
"@rhds/elements/rh-alert/rh-alert.js": "/dx/v1/@rhds/elements@1.0.1/rh-alert/rh-alert.js",
```

This won't work when placed on pages at other domains, but it can serve as the 
basis for further configuration and tooling.

### Assets

While we can depend on import maps to rewrite module paths, this won't work for 
assets like global stylesheets. We would still need to link to the files in 
their original directory structure. This is fine, but provides a somewhat 
unpleasant "developer experience":

```html
<script type="module" webc:keep>import '@rhds/elements/rh-footer/rh-footer.js';</script>
<link href="https://redhatstatic.com/dx/v1/@rhds/elements@1.0.1/elements/rh-footer/rh-footer-lightdom.css"
      rel="stylesheet" webc:keep>
```

That `elements@1.0.1/elements` is a minor annoyance. For this reason, we copy 
those assets (by filename convention) to the directory they would appear to be 
in according to the import map. Let's hope for a spec solution for this one.

## Opportunities for Improvement

Make it public
: The current iteration of our build chain doesn't have any specifically 
corporate stuff in it, so we're hoping to package this thing up for public 
consumption as a <abbr title="free and open source software">F/OSS</abbr> 
package soon.

Non-destructive / less-destructive builds
: At the moment we need to rebuild the entire directory structure each time we 
run an update. We'd like to instead rely on the stateful information recorded in 
the `meta.json` file to only build and publish updated packages.

JSPM provider plugin
: [JSPM's generator package][jspm-cli] is a provider-agnostic utility for 
generating import maps. We'd like to ship a provider plugin so that teams using 
our CDN can automate their import map construction.

<abbr title="semantic versioning">Semver</abbr> range URLs
: It would be swell to let our users specify a *version range* when importing, 
  rather than requiring them to pin a version to their import maps.

  ```html
  <script type="importmap" webc:keep>
  { "imports": {
    "@rhds/elements/": "https://redhatstatic.com/dx/v1/@rhds/elements@^1/" } }
  </script>
  ```

  We think we can manage this either in the spaship config or in the host CDN's 
  HTTP config, and this shouldn't require a running app, so long as we write the 
  lookup table of semver strings, or maybe a supported subset of them, at each 
  build. [Functions are just lookup tables][pure], after all.

More explicit vendor bundles
: While the hashed chunk solution seems reasonable for now, we'd prefer to 
bundle up certain well-known dependencies (like `lit` and `tslib`) by version 
into minified vendor bundle files. There's an [open issue on esbuild for "manual 
chunks"][manual-chunks] which has gained much attention, and it appears to be on 
Evan Wallace' radar, so we'll pursue that or a similar solution when it becomes 
available.

## Thanks

**Michael Potter**, for doing most of the work. **Ivana Rodriguez** for her 
interest and feedback. **Zack Hawkins**, for his careful review and pointed 
constructive critique. **Kyle Buchanan** for his support, brainstorming, and 
interest, and **Rob Chappell** for the initiative and managerial support.

[^1]: at least as far as [package entry points][exports] are concerned.
[^2]: UNPKG does not support package entry points (aka export maps) as of this 
writing

[exports]: https://nodejs.org/api/packages.html#package-entry-points
[rhds]: https://ux.redhat.com
[jspm]: https://jspm.dev
[jspm-cli]: https://jspm.dev
[esm]: https://esm.sh
[unpkg]: https://unpkg.com
[unpkgqp]:https://unpkg.com/#query-params
[rollup]: https://rollupjs.org
[esbuild]: https://esbuild.github.io
[dblreg]: 
https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Scoped-Custom-Element-Registries.md#why-do-developers-need-scoped-custom-element-registries
[importmaps]: https://html.spec.whatwg.org/multipage/webappapis.html#import-maps
[spaship]: https://spaship.io/
[pnpm]: https://pnpm.io/
[pure]: https://tylerayoung.com/2022/03/16/write-more-pure-functions/
[manual-chunks]: https://github.com/evanw/esbuild/issues/207
