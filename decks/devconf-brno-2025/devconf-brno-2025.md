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

# Exploring new and upcoming Web Components features {data-slide data-slide-tag-name=dc25-slide-title slot=heading}

<!-- A Performant Design System {slot=subheading} -->

Benny Powers
: Principal UX Engineer
{slot=speaker}

<div slot="notes">



</div>

## ElementInternals {data-slide slot="title" data-slide-tag-name=dc25-slide}
- Accessibility features (aria) defaults
  - most features already available across browsers
  - some features like ariaLabelledByElements not yet x-browser
  - aXe core may fail your pages even if they pass manual audits

## Reference Target {data-slide slot="title" data-slide-tag-name=dc25-slide}
- [Reference Target for cross root aria](https://github.com/web-platform-tests/interop/issues/792)
- IDs are scoped to shadow roots
- aria features which work by id reference can't work across shadow boundaries
- activedescendant, controls, labelledby

## Declarative Custom Elements {data-slide slot="title" data-slide-tag-name=dc25-slide}
- long way off
- Declarative custom elements
- [CSS module scripts](https://github.com/web-platform-tests/interop/issues/703)
- HTML modules
- DOM Parts / templating

## host has {data-slide data-slide-tag-name=dc25-slide}
-:[host:has()](https://github.com/web-platform-tests/interop/issues/791)
- style the host element depending on it's shadow content
- eg shadow classes
- not the same as :has-slotted()

## Scoped Custom Element Registries {data-slide data-slide-tag-name=dc25-slide}
- good for micro frontend
- let teams collaborate more easily in the same page
- avoid double registration errors

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
