---
title: Import Maps for Cross-team Collaboration
published: true
audience: |
  CMS admins, web app developers, microfrontend teams, HTML design system
  creators, web performance enthusiasts, cross-team product managers
description: |
  Loading subresources can get complicated when multiple teams all work on the 
  same page. Import maps, and supportive CDNs can help grease the gears, letting
  teams focus on shipping their features without stepping on each other's toes.
  It's not a magic bullet though, teams will still have to communicate with each
  other around release schedules. Read on to learn more about import maps and
  CDNs for large organizations
tldr:
  In large organizations, it takes many inputs across multiple teams to produce
  a single web page. Import maps aid in reducing the potential friction between
  teams by abstracting package names over resource URLs.
coverImageAlt: an old-timey treasure map with a team surrounding it
coverImage: /assets/images/import-map-teams.png
---

## The Setup

In large software companies, it's common to find multiple teams working on one document (i.e. web page). Moreover, different teams might work on an own completely separate processes which all contribute to one output appearing in the end user's browser. It may not be possible or desirable for those separate teams to perfectly coordinate their efforts.

<script type="module">

import mermaid from 'https://esm.sh/mermaid';
const darkMode = !!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
mermaid.run({
  querySelector: '.mermaid',
  suppressErrors: true,
  darkMode,
  theme: darkMode ? 'dark' : 'base',
});
</script>

<figure>
  <pre class="mermaid">
  flowchart TD
      A[CMS Admins];
      D[Page Designers];
      C[Content Authors];
      L[Localizers];
      M[Marketers];
      F[Front Devs];
      Ds[Design System Maintainers];
      R[/Package Registry\];
      H{Server Rendered Head};
      B{Server Rendered Body};
      P{Server Rendered Document};
      MF{Microfrontend};
      E{Edge CDN};
      Docs((Design system docs));
      SPA{Single Page App};
      Cl(Customer);
      Ds -.Version release.-> R
      Ds -.Version release.-> Docs
      Docs --> A
      Docs --> D
      Docs --> C
      Docs --> L
      Docs --> M
      Docs --> F
      R -.Package install.-> A
      R -.Package install.-> MF
      R -.Package install.-> SPA
      C -.Package request...-> A
      D -.Package request...-> A
      subgraph content [Content org]
          A --> |CMS Process| H
          A --> |CMS Process| B
          C --> |Content Process| B
          D --> |Design Process| B
          L --> |l10n| B
          H --> P
          B --> P
      end
      subgraph market [Marketing org]
          M --> man(Analytics)
          M --> mab(A/B)
          M --> mpc(Personalized content)
      end
      subgraph product [Product org]
          F --> MF
          F --> SPA
      end
      subgraph TD last [Last Mile]
          E -.www.-> Cl
      end
      P --> E
      SPA --> E
      man --> E
      mab --> E
      mpc --> E
      MF --> |Integration| B
  </pre>
  <figcaption>Goodness gracious! Turns out making a single web page can be awfully complicated!</figcaption>
</figure>

That's a fairly complicated setup, and I even simplified the diagram for this post!
Summing it up, complexity arises here because we have:

> - Many teams => One document
> - Many processes => One output

When it comes to JavaScript resources, This can cause conflicts when loading the same or similar code on the page. In the best case, this merely causes duplication of code (i.e. js bloat), slowing down page load and interactivity, annoying users, discouraging conversions and sales, and lowering the bottom line.

At worst, this setup can lead to run time conflicts and errors, in particular the  infamous "custom-element double registration" error, which will occur when two separate resources try to register the same custom element name. This is because _custom element tag names are globally registered_ and can only be registered once.

For example, a domain admin might create a minified bundle of version 1.0.0 of a design system, and load it on every page. Subsequently, a page content author might load up a CDN link to an individual design system element. Even if it's the same package version (1.0.0), if the individual element module tries to register a tag name already registered in the bundle, it will fail.

If the page admin has perfect _a priori_ knowledge of which elements are loaded on which pages, or if they simply load all elements on all pages, and if all content authors employ strict discipling in refraining from loading JavaScript resources, we can be reasonably confident that we'll avoid these errors for server-rendered content.

If the marketing department or a related product team wants to run some client-rendered JavaScript to pull in marketing materials, or run an SPA or microfrontend. If those teams are able to coordinate with the domain admin, they can agree to use the preloaded bundle (which will now by force have to load every element for every page, even if only one element is needed).

But if those marketing or product teams need to ship their content or apps to multiple domains with separate admins and diverse processes (as is likely to be the case in very large organizations), it can very quickly become prohibitively complicated to coordinate between admins, authors, and teams for every release of every page on every domain.

How can we enable multiple teams, at multiple levels in an organization, to work on the same document, and use the same web components - a la carte - without requiring them to load the entire bundle in advance?

## Two Complimentary Solutions

Organizations can benefit from either or both of two web standards in this situation: [scoped custom element registries][scer] and [import maps][import-maps]. These two specs can be used independently or in concert to help with the many-to-one problems described above.

### Scoped Custom Element Registries

The idea here is to give custom-element authors the ability to re-register a tag name which exists elsewhere on the page, but scoped to a particular shadow root. This is useful in the microfrontend example above. The product team could load the specific versions of the web components they want and _privately_ register their tag names within the shadow root (or shadow roots) of their microfrontend app.

#### Pros

- Spec track solution, so it's future-proof
- Teams can load the *specific* versions they want
- *multiple* versions can coexist on the page

#### Cons

- The polyfill must be specifically included (opted in) in every component's definition
- Requires Shadow DOM - (in fact, this is a plus, but some may consider this a dealbreaker)
- Custom element authors must provide "pure" modules, which is not always the case

In many cases, the cons listed here may not be of any consequence, but for well-established projects with tight integration requirements, it may be prohibitive to refactor all the components, just to get a polyfilled solution which doesn't match downstream expectations. Although teams at large organizations have successfully deployed the scoped custom element registries polyfill, in my opinion it is best to wait for this feature to land cross-browser and use it in combination with a future HTML module / declarative custom elements syntax.

### Import Maps

Available today cross browser and even in server-side runtimes like Deno, import maps let **page authors** customize the way the browser loads javascript modules. For more about how to use import maps, read my [earlier post](/posts/import-map-cdn/#import-maps-on-one-foot).

An import map is a JSON object that specifies the URLs to use for a given import specifier or path prefix. At the moment, they must be included _inline_ in the page in order for the browser to execute.

```html
<script type="importmap">
{
  "imports": {
    "@patternfly/elements/": "https://esm.sh/@patternfly/elements@2.0.1/"
  }
}
</script>
```

Import maps let page or app authors write familiar 'bare-specifiers', meaning import statements that look like:

```js
import '@patternfly/elements/pf-button/pf-button.js';
```

Without import maps, they'd either have to write URL path import statements, or use a bundler on the server-side:

```js
import '/assets/packages/@patternfly/elements/pf-button/pf-button.js';
```

#### Pros

- Developers can reference modules by package, instead of by URL
- Shipped cross browser (91.53% support globally as of this writing, according to [caniuse][caniuse])
- Can [scope module resolutions][import-map-scopes]

#### Cons

- Can only use one import map at a time
- Can't [yet][import-map-src] load import maps by URL (i.e. `<script type="importmap" src="...">`)
- Doesn't scope custom element names, so some level of cross-team communication is still required

## A Cross-Team Plan for Import-Map Adoption

Import maps can help large organizations' internal collaboration by aligning around **package names** rather than **resource addresses**. By adopting import maps, the 'surface area' for disagreement between teams can be reduced to "which version" of a package to load, rather than "which version, in what format, and at what address". A practical sketch of how this might look follows.

### Three Spheres

Large organizations can adopt import maps by thinking of three spheres of interest for each page:

1. CMS admins / domain-level teams / tool-and-process owners
2. page-or-app level teams / section owners
3. microfrontend teams / content authors / content injection authors

The first sphere is responsible for establishing and maintaining the tools and processes which produce each page. As a rough guide: they have the last word and are generally in charge of shared resources in the `<head>`.

The second sphere is responsible for producing the content on entire areas of the site, but are not directly responsible for shared tools and processes. They generally-speaking use the tools and processes, but don't write or define them.

Lastly, teams in the third sphere produce content which is injected into the page after-the-fact. As far as resource loading goes, this content is arbitrary and independent of the content and planning done by the second sphere, but it may be beholden to the process decisions from the first sphere.

With that concept of the division of responsibilities in mind, teams shall:

1. agree ahead-of-time on the major version line of the shared packages available for use,
2. write page code which imports modules *by package* instead of *by url*
3. establish a release schedule for major version updates, with lead time for teams to adapt their code.

It's important to recognize that **import maps don't have to be the same across an entire domain**. Each page can have it's own import map, so pages which don't dynamically load up content from the third sphere have a smaller surface area for disagreement between teams. Second-sphere teams that want to customize the import map on a given page can put in a request with admins, or admins might provide a per-page escape hatch (think CMS content knob) for app teams to override or customize the domain-wide import map. Tools like the `@jspm/generator` package help admins the manage dependencies within each page's import map.

This means that third-sphere teams only have to go one organizational level up (to the page owners) in order to solve their dependency issue, rather than having to go two levels up to the domain admins.

## Potential Problems

This approach is useful in limiting areas of potential clash between domain admins, page authors, and content-injecting teams, but it doesn't eliminate them. Even if the organization adopts import maps writ-large, teams in the second or third spheres who do not update their pages (or who do not opt them out of updates) in time for major package releases may find their experiences breaking when shared libraries are updated.

Similarly, third-sphere contributors, who are the furthest organizationally from the decision makers in the first and second spheres may not be aware that breaking changes are incoming, so effort will have to be expended to keep them up to date.

These problems exist when bundlers or import-by-URL are employed as well, but import maps reduce their severity by rationalizing imports around package names.

[caniuse]: https://caniuse.com/import-maps
[import-map-src]: https://github.com/WICG/import-maps/issues/235
[import-map-scopes]: https://github.com/WICG/import-maps#multiple-versions-of-the-same-module
[scer]: https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Scoped-Custom-Element-Registries.md
[import-maps]: https://github.com/WICG/import-maps/

