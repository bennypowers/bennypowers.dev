---
title: Teaching AI to Speak Web Components
layout: single-file-deck.html
description: |
  Learn how CEM CLI and the Model Context Protocol enable AI assistants to
  understand and compose web components correctly. Discover how structured
  metadata from Custom Elements Manifest powers not just AI, but an entire
  ecosystem of developer tools including IDE integrations and documentation
  generators. This hands-on codelab will teach you to generate manifests,
  set up MCP servers, and use AI to compose complex layouts with real design
  system components.
coverImage: /decks/cem-mcp-codelab/images/cover.svg
date: 2025-11-18
published: true
venue:
  name: CEM CLI Codelab
icons:
  - rel: shortcut icon
    sizes: any
    href: /decks/cem-mcp-codelab/images/red-hat.svg
tags:
  - deck
eleventyImport:
  collections:
    - icon
---

# Teaching AI to Speak <br> Web Components {data-slide-tag-name=slidem-slide}

<ul class="icon-grid" role="presentation">
  <li><rh-icon set="standard" icon="conversation" aria-label="json"></rh-icon></li>
  <li><rh-icon set="standard" icon="ai-ml" aria-label="brain"></rh-icon></li>
  <li><rh-icon set="standard" icon="code" aria-label="HTML"></rh-icon></li>
</ul>

## CEM CLI & the Model Context Protocol

<kbd>←</kbd> <kbd>→</kbd> *or* <kbd>h</kbd> <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd>

## The AI Promise {data-slide-tag-name=slidem-slide}

AI assistants that understand your design system

![Galaxy brain meme](images/galaxy-brain.gif) {.center}

- Compose complex layouts correctly
- Use the right attributes and slots
- Follow accessibility patterns
- Maintain design consistency
{slot=notes}

"Build me a three-card hero section"
{slot=notes}

## The Reality {data-slide-tag-name=slidem-slide}

AI hallucinates component APIs
- Invents non-existent attributes
- Uses wrong slot names
- Misses required properties
- Creates invalid HTML
{slot=notes}

Manual corrections for every generation
{slot=notes}

![We are helping meme](images/we-are-helping-reboot.gif) {.center}

## What If AI *Actually* Knew? {data-slide-tag-name=slidem-slide}

<rh-blockquote style="display: block; margin-block-start: 14rem; max-width: 60vw;">

What if we could give AI the actual component
documentation, in an AI-native way?

</rh-blockquote>

## Quick Context: Web Components {data-slide-tag-name=slidem-slide}

- **Custom elements**: Define your own HTML tags
- **Shadow DOM**: Encapsulated styling and markup
- **Framework-agnostic**: Works everywhere

Used by major design systems:

- ![Red Hat Design System](/assets/icons/redhat.svg)
- ![Adobe Spectrum](/assets/icons/adobe.svg)
- ![Microsoft FAST](/assets/icons/microsoft.svg)
- ![Google Material Web](/assets/icons/google.svg)
- ![SAP Fiori](/assets/icons/sap.svg)
{.logos}

Browser-native, long-term stable
{slot=notes}

## Custom Elements Manifest {data-slide-tag-name=slidem-slide}

JSON schema describing components in detail

W3C community group recommendation


```json
{
  "schemaVersion": "2.1.0",
  "modules": [{
    "kind": "javascript-module",
    "path": "elements/rh-button/rh-button.js",
    "declarations": [{
      "kind": "class",
      "name": "RhButton",
      "tagName": "rh-button",
      "customElement": true,
      "attributes": [{
        "name": "variant",
        "type": { "text": "primary | secondary | tertiary" },
        "description": "Button style variant"
      }],
      "slots": [{
        "name": "icon",
        "description": "Optional icon before text"
      }]
    }],
    "exports": [{
      "kind": "custom-element-definition",
      "name": "rh-button",
      "declaration": { "name": "RhButton" }
    }]
  }]
}
```

Everything an AI (or IDE) needs to know
{slot=notes}

## CEM CLI: The Toolkit {data-slide-tag-name=slidem-slide}

Open source tool for working with Custom Elements Manifests

Three main capabilities:
1. **Generate** - Create manifests from code
2. **LSP** - IDE integration
3. **MCP** - AI integration

## 1. Generate {data-slide-tag-name=slidem-slide}

Create manifests automatically from your codebase

```bash
$ npm install --save-dev @pwrs/cem
$ npx cem generate elements/**/*.ts
```

Outputs `custom-elements.json` with complete metadata

## 2. LSP: IDE Superpowers {data-slide-tag-name=slidem-slide}

Language Server Protocol brings component knowledge to your editor

- **Autocomplete** for custom elements and attributes
- **Hover documentation** inline
- **Validation** with autofixes
- **Go-to-definition** for components
- **Slot validation** for proper composition

## LSP Filetypes {data-slide-tag-name=slidem-slide}

- HTML files
- TypeScript template literals
- JSX/TSX (with proper setup)

VS Code extension available

## MCP {data-slide-tag-name=slidem-slide}

Model Context Protocol connects structured data to AI systems

Developed by Anthropic for Claude (but open to all)

Two key concepts:
- **Resources**: Static data AI can read
- **Tools**: Actions AI can perform

CEM CLI provides both for web components
{slot=notes}

## MCP Resources {data-slide-tag-name=slidem-slide}

- `cem://packages` - Workspace package discovery
- `cem://elements` - All available elements
- `cem://element/{tagName}` - Component details
- `cem://element/{tagName}/attributes` - Attribute docs
- `cem://element/{tagName}/slots` - Slot guidelines
- `cem://element/{tagName}/css/*` - Styling APIs
- `cem://accessibility` - A11y patterns
- `cem://guidelines` - Design system rules

## MCP Tools {data-slide-tag-name=slidem-slide}

What the AI can do:

- **Validate HTML**: Check generated markup against schemas
- **Suggest attributes**: Recommend correct properties
- **Generate HTML**: Create valid component markup
- **CSS integration**: Understand design tokens and styling

All powered by the manifest
{slot=notes}

## How It Works {data-slide-tag-name=slidem-slide}

```
🏦 Custom Elements Manifest
   ↓
   🖥️ MCP Server
      ↓
      🧠 AI Assistant
         ↓
         ⌨️ LSP Editor Support
            ↓
            🧑‍🍳 Awesome HTML ✓
```

Standards-based metadata enables AI that works for you

## Standards Enable Ecosystems {data-slide-tag-name=slidem-slide}

Structured metadata from Custom Elements Manifest powers:

- ✓ **IDE tooling** (LSP autocomplete, validation)
- ✓ **Documentation generators** (Storybook, SSGs)
- ✓ **AI assistants** (MCP, code generation)

Better standards → Better tooling → Better developer experience

## Community-Driven {data-slide-tag-name=slidem-slide}

Custom Elements Manifest:
- **W3C Web Components Community Group**
- **Open specification**
- **Growing adoption** across frameworks and tools

## Community-Driven {data-slide-tag-name=slidem-slide}

CEM CLI:
- **Free and open source** (GPL v3)
- **Written in Go**
- **Community contributions** welcome

## Let's Try It! {data-slide-tag-name=slidem-slide}

Clone the Scaffolding, Install deps, Start the Server. {.left}

```bash {.left}
$ gh clone bennypowers/cem-mcp-codelab-starter
$ npm ci
$ npm start
```

In a new shell, add to your Claude Code config, and start Claude {.left}

```sh
$ claude mcp add --transport stdio cem cem mcp
$ claude
```

Verify that mcp is loaded with `/mcp` {.left}

<p slot="notes">Fetches `@rhds/elements`, `@web/dev-server`, and `@pwrs/cem`.</p>
<p slot="notes">Restart Claude Code to connect</p>

## Try It 🎲 {data-slide-tag-name=slidem-slide}


<div style="margin: 2rem 6rem; display: grid; grid-template: 2fr / 1fr 1fr; gap: 2rem;">
  <rh-card><rh-blockquote>Build an episode page for the Red Hat podcast <span lang="he">מדברים פתוח</span></rh-blockquote></rh-card>
  <rh-card><rh-blockquote>Build a progress indicator for a four-step VM install</rh-blockquote></rh-card>
  <rh-card style="grid-column: span 2"><rh-blockquote>Compose a landing page for OpenShift with navigation and a three card section</rh-blockquote></rh-card>
</div>

## What You Learned {data-slide-tag-name=slidem-slide}

- ✓ Custom Elements Manifest provides structured component metadata
- ✓ CEM CLI generates, validates, and serves manifests
- ✓ LSP brings component knowledge to your IDE
- ✓ MCP connects manifests to AI systems
- ✓ Standards enable entire tooling ecosystems

## Resources {data-slide-tag-name=slidem-slide}

<div class="grid-4">
  <rh-tile>
    <div slot="title">CEM CLI</div>
    <h3 slot="headline">
      <a href="https://github.com/bennypowers/cem">
        <rh-icon slot="icon" set="social" icon="github"></rh-icon>
        github.com/bennypowers/cem
      </a>
    </h3>
  </rh-tile>
  <rh-tile>
    <div slot="title">Custom Elements Manifest</div>
    <h3 slot="headline">
      <a href="https://github.com/webcomponents/custom-elements-manifest">
        <rh-icon slot="icon" set="social" icon="github"></rh-icon>
        github.com/webcomponents/custom-elements-manifest
      </a>
    </h3>
  </rh-tile>
  <rh-tile>
    <div slot="title">Model Context Protocol</div>
    <h3 slot="headline">
      <a href="https://modelcontextprotocol.io">
        <rh-icon slot="icon" set="social" icon="github"></rh-icon>
        modelcontextprotocol.io
      </a>
    </h3>
  </rh-tile>
  <rh-tile>
    <div slot="title">Red Hat Design System</div>
    <h3 slot="headline">
      <a href="https://ux.redhat.com">
        <rh-icon slot="icon" set="social" icon="github"></rh-icon>
        ux.redhat.com
      </a>
    </h3>
  </rh-tile>
</div>

## Thanks {data-slide-tag-name=slidem-slide}

<div id="thanks-links">
  <rh-avatar name="Benny Powers"
             src="/assets/images/ness.png">
    <span slot="subtitle">Senior Principal Software Engineer</span>
    <br slot="subtitle">
    <em slot="subtitle">Red Hat</em>
  </rh-avatar>

- [![github](/assets/icons/github.svg)  bennypowers](https://github.com/bennypowers)
- [![npm](/assets/icons/npm.svg)  @pwrs/cem](https://bennypowers.dev/cem/)

</div>

<link data-helmet rel="shortcut icon" href="/decks/cem-mcp-codelab/images/red-hat.svg"> <link data-helmet rel="preconnect" href="https://fonts.googleapis.com">
<link data-helmet rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link data-helmet rel="stylesheet" href="../../assets/red-hat-font.css">
<link data-helmet rel="stylesheet" href="/assets/@rhds/elements/rh-tile/rh-tile-lightdom.css">
<link data-helmet rel="stylesheet" href="https://unpkg.com/@rhds/tokens@3.0.2/css/global.css">
<link data-helmet rel="stylesheet" href="../../assets/prism.css">
<link data-helmet rel="stylesheet" href="cem-mcp-codelab.css">
<script data-helmet type="module">
  import "/assets/dsd.js";
  import '@rhds/elements/rh-avatar/rh-avatar.js';
  import '@rhds/elements/rh-card/rh-card.js';
  import '@rhds/elements/rh-blockquote/rh-blockquote.js';
  import '@rhds/elements/rh-icon/rh-icon.js';
  import '@rhds/elements/rh-tile/rh-tile.js';
</script>
