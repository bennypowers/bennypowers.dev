---
title: Exploring new and upcoming Web Components features
layout: single-file-deck.html
description: |
  Web components are a widespread and proven technology for developing
  browser-native UIs. A number of new and upcoming features like import
  attributes, reference targets, and declarative custom elements make web
  components even more attractive as a part of your front end stack. In this
  talk we'll explore some of those new APIs from a web development,
  accessibility, and architectural perspective and see how they help your
  community, open source project, or organization improve performance and
  accessibility, reduce development time, avoid costly technical debt, and
  boost engineering talent. If you are a **developer**, **project manager**, or
  **technology recruiter**, this talk will inform you about the state of the art in
  front-end web technologies.
coverImage: /decks/devconf-brno-2025/cover.png
date: 2025-06-12
published: true
venue:
  name: DevConf.cz 2025
  url: https://pretalx.devconf.info/devconf-cz-2025/talk/YAETPC/
icons:
  - rel: shortcut icon
    sizes: any
    href: /decks/devconf-brno-2025/devconf-logo.png
tags:
  - deck
eleventyImport:
  collections:
    - icon
---

# `DOMStandards.process()` {data-slide-tag-name=dc25-slide-title slot=heading}

## Exploring new and upcoming<br>Web Components features {slot=subheading}

Benny Powers
: Principal UX Engineer
{slot=speaker}

## ElementInternals {data-slide-tag-name=dc25-slide-bold data-slide-class=secondary}

### What is `ElementInternals`? {data-slide-tag-name=dc25-slide slot=title}
- ElementInternals is a powerful web API allowing custom elements to participate 
more fully in browser features, especially accessibility.
- Contains internal element features like default ARIA states and roles, custom 
states, and custom validation
- Enables custom elements to behave like native elements in terms of 
accessibility and forms.

ARIA stands for **A**ccessible **R**ich **I**nternet **A**pplications
{slot=notes}

### Accessibility Features and Cross-Browser Support {data-slide-tag-name=dc25-slide slot=title}
- Most ARIA-related features are now supported in all major browsers via ElementInternals.
- However, some APIs (e.g., `ariaLabelledByElements`) are not yet fully cross-browser.
- Accessibility testing tools like axe-core may not always accurately flag issues due to these gaps,
so manual testing is still recommended.

### Practical Impact on Development {data-slide-tag-name=dc25-slide slot=title}
- Using ElementInternals improves accessibility defaults for custom elements, reducing manual ARIA management.
- Allows for more robust, accessible design systems built with Web Components.
- Example: Associating a custom input with `<label>` and forms, or managing ARIA attributes automatically.

---

## Reference Target {data-slide-tag-name=dc25-slide-bold data-slide-class=secondary}

### The Challenge of Shadow DOM & ARIA References {data-slide-tag-name=dc25-slide slot=title}
- Shadow DOM encapsulation scopes element IDs, so references like `aria-labelledby` can break across shadow boundaries.
- Many ARIA attributes (`aria-activedescendant`, `aria-controls`, `aria-labelledby`) depend on referencing elements by ID.

Shadow DOM is the private, encapsulated portion of a web component, containing it's own HTML
{slot=notes}

### Reference Target Proposal {data-slide-tag-name=dc25-slide slot=title}
- Reference Target is a proposed solution to allow ARIA references to work across shadow DOM boundaries.
- Would enable more accessible, composable components by allowing safe cross-root references.
{slot=notes}

```html
<label for="fancy-input">Fancy input</label>
<fancy-input id="fancy-input">
  <template shadowrootmode="closed"
            shadowrootreferencetarget="real-input">
    <input id="real-input">
  </template>
</fancy-input>
```

Snippet by Westbrook Johnson
{slot=notes}

- [WICG Proposal: Reference Target](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md)
- [WebEngines Hackfest 2025](https://alice.pages.igalia.com/2025-hackfest-reference-target/#/2)

### Current Workarounds & Future Impact {data-slide-tag-name=dc25-slide slot=title}
- Workarounds include flattening the DOM or duplicating elements for accessibility, but these are complex and brittle.
- Reference Target aims to simplify authoring and improve accessibility without sacrificing encapsulation.

---

## Declarative Custom Elements {data-slide-tag-name=dc25-slide-bold data-slide-class=secondary}

### What Are Declarative Custom Elements? {data-slide-tag-name=dc25-slide slot=title}
- Declarative custom elements allow you to define and instantiate custom elements purely in HTML, without imperative JavaScript.
- Enables features like HTML modules, CSS module scripts, and template-based DOM parts.

### The Road Ahead {data-slide-tag-name=dc25-slide slot=title}
- These features are still experimental and not available in most browsers.
- Declarative custom elements will make it easier to share, reuse, and compose web components natively.

### Related Technologies {data-slide-tag-name=dc25-slide slot=title}
- CSS module scripts: Import and use CSS directly in JS modules.
- HTML modules: Import HTML like JS or CSS modules, improving code organization.
- DOM Parts/Templating: Fine-grained templating APIs that boost performance and maintainability.
- [See WPT Interop Issue #703](https://github.com/web-platform-tests/interop/issues/703)

---

## `:host(:has())` {data-slide-tag-name=dc25-slide-bold data-slide-class=secondary}

### :host(:has()) Selector {data-slide-tag-name=dc25-slide slot=title}
- The `:host(:has(...))` selector enables styling the host element based on its shadow content.
- Allows for dynamic styling based on the presence or state of children inside shadow DOM.

### Use Cases & Differences {data-slide-tag-name=dc25-slide slot=title}
- Example: Apply a border to a custom element only when a certain class is present within its shadow DOM.
- Not the same as `:has-slotted()`, which targets slotted, light DOM children.
- Brings new power to styling encapsulated components.
- [See WPT Interop Issue #791](https://github.com/web-platform-tests/interop/issues/791)

---

## Scoped Custom Element Registries {data-slide-tag-name=dc25-slide-bold data-slide-class=secondary}

### Why Scoped Registries? {data-slide-tag-name=dc25-slide slot=title}
- Scoped Custom Element Registries allow custom elements to be registered per shadow root, not globally.
- Solves the problem of name collisions and double registration when combining components from multiple sources.

### Micro Frontends & Collaboration {data-slide-tag-name=dc25-slide slot=title}
- Ideal for micro-frontend architectures where multiple teams deliver components to the same page.
- Each team can use their own version of a component without conflicts.

### Developer Experience {data-slide-tag-name=dc25-slide slot=title}
- Encourages collaboration and reuse without worrying about global registry pollution.
- Simplifies large-scale adoption of web components in enterprise applications.

<link data-helmet rel="shortcut icon" href="/decks/devconf-brno-2025/devconf-logo.png">
<link data-helmet rel="preconnect" href="https://fonts.googleapis.com">
<link data-helmet rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link data-helmet rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap">
<link data-helmet rel="stylesheet" href="devconf-brno-2025.css">
<script data-helmet type="module">
  import "/assets/dsd.js";
  import "./components/dc25-slide.js"
  import "./components/dc25-slide-bold.js"
  import "./components/dc25-slide-divider.js"
  import "./components/dc25-slide-title.js"
  await customElements.whenDefined('dc25-slide');
  await customElements.whenDefined('dc25-slide-bold');
  await customElements.whenDefined('dc25-slide-title');
  await customElements.whenDefined('dc25-slide-divider');
  await new Promise(r => setTimeout(r, 500));
  for (const slide of document.querySelectorAll('#deck > *'))
    slide.afterStamp?.();
</script>
