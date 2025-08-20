---
title: Introducing CEM Language Server
published: true
date: 2025-08-19
tags:
  - web components
  - lsp
  - treesitter
  - lit
  - performance
  - go
  - typescript
audience: Web developers, LSP enthusiasts, custom elements users, gophers
tldr: >-
  Remember wishing your editor actually *understood* your custom elements? Wish granted. The CEM Language Server is here, and it's built right. ✨
  After weeks of development, the CEM Language Server is finally here! Built 
  from the ground up in Go with proper error handling, comprehensive testing, 
  and all the LSP features you'd expect for working with custom elements.
coverImage: /assets/images/introducing-cem-lsp.jpg
coverImageAlt: >
  Geometric abstract composition featuring interconnected platonic solids in
  harmonious arrangement. Multiple polyhedra (tetrahedron, cube, octahedron,
  dodecahedron, icosahedron) floating in space with subtle connecting lines or
  energy flows between them, suggesting collaborative interaction.
---

## 🚀 Quick Start

1. **Install**: `go install bennypowers.dev/cem`, use [npm][install], or download the [binary release][cem]
2. **Editor Setup**: Install LSP client for [VS Code][vscode-ext], [Zed][zed-ext], [Neovim][nvim-setup], or [Emacs][emacs-setup]
3. **Configure**: Point to your `custom-elements.json` manifest files
4. **Enjoy**: Auto-complete, hover docs, and go-to-definition for your custom elements

📖 [Full documentation][cem-docs]  | 💬 [Get help][discussions]

---

Picture this: you're jamming away on your web development project, using your favourite web components to save time and build better, and your editor is... well, less than helpful. No completions for your element names, no hover hints for attributes, no go-to-definition for your components. You're flying blind in a world of `<my-fancy-element>` tags that might as well be hieroglyphs to your IDE.

*Not anymore, homestyle!*

<video autoplay muted loop playsinline>
  <source src="/assets/videos/cem-lsp-intro-demo.webm" type="video/webm">
</video>

Today I'm absolutely thrilled to introduce the **CEM Language Server** — a brand new LSP implementation built from scratch in Go that actually understands your custom elements and makes working with them a joy.

## Standing on the Shoulders of Giants

Before we dive into what CEM Language Server brings to the table, I need to give massive credit where it's due. This project exists because of the pioneering work by [Matsuuu][matsuuu] on [custom-elements-language-server][cels]. His TypeScript-based LSP proved that custom elements tooling could be *so much better* than the status quo, and showed exactly what features developers needed.

When I started exploring the idea of building CEM Language Server, I reached out to Matsuuu to discuss it. He was incredibly gracious about the whole thing — gave his blessing for the project and shared valuable insights about LSP implementation challenges. He's been swamped with other commitments lately and hasn't had much time to work on custom-elements-language-server, which made this new implementation feel like a good way to keep pushing the ecosystem forward. This tool wouldn't exist without his foundation work and ongoing collaboration.

## 🎯 What It Actually Does for You

CEM Language Server reads your Custom Element Manifest files (the [CEM format][cem-format] that tools like Lit's analyzer output) and transforms your editor into a custom elements powerhouse. Instead of constantly context-switching to documentation or guessing at API names, you get instant, contextual help right where you're coding.

The completions are *smart* — type `<my-` and watch your custom elements appear with full documentation. Working on a slot? The LSP knows exactly which slots your element supports. Building a theme? CSS custom properties show up with their default values and descriptions.

When something's wrong, you know immediately. Typo in an element name? Red squiggle. Using an attribute that doesn't exist? Helpful error with suggestions. The goal is to catch mistakes before you even save the file, let alone run your tests.

And when you need to understand how something works, go-to-definition actually takes you to the source code — whether that's a TypeScript class, a Lit component, or even template literals in JavaScript files.

For the complete feature rundown and setup instructions, check out the [documentation site][cem-docs].

## 🏗️ Built Right from Day One

Building from scratch means you get to make good architectural decisions upfront instead of fighting legacy choices later. Here are the big ones that matter:

**Separation of concerns**: The LSP protocol layer, document management, manifest processing, and tree-sitter parsing are all cleanly separated. This means you can understand, test, and modify each piece independently. Want to add a new LSP method? You don't need to understand the manifest format. Need to optimize parsing? The protocol layer is untouched.

**Incremental everything**: Instead of re-parsing entire files on every keystroke, we use tree-sitter's incremental parsing to only process what changed. Same with manifest caching — we track file modification times and only reload what's actually different. The result? Fast response times even in large projects.

**Concurrent by design**: Go's goroutines let us handle multiple document operations simultaneously while keeping everything thread-safe. When you're working on a project with dozens of manifest files, this parallel processing is the difference between instant feedback and waiting around.

**Testing as a first-class citizen**: Every component has comprehensive tests, we use fixture files instead of hardcoded strings, and race condition detection catches concurrency bugs before they ship. This isn't "testing bolted on later" — it's "testing as part of the design."

**The beautiful symmetry of one tool**: Here's where things get really interesting — CEM Language Server doesn't just *read* Custom Element Manifest files, it's built on the same codebase that *generates* them in the first place. When the same tool that parses your TypeScript code to create the manifest is also serving up completions and hover information, you get zero serialization overhead (everything stays in memory as native Go data structures), perfect consistency (no drift between analyzer and LSP), and radical dependency reduction (one binary instead of multiple tools to keep in sync). It's the kind of architectural decision that feels obvious in retrospect but requires building the whole system from scratch to achieve.

These architectural choices pay dividends in **performance** (fast even on big projects), **maintainability** (contributors can understand and modify code confidently), and **reliability** (it works the same way every time).

## 🎯 Why Go?

You might wonder: why rewrite this in Go when Matsuuu's TypeScript implementation already worked? A few reasons:

1. **Performance**: Go's concurrency model and compiled nature make it *fast*
2. **Memory efficiency**: Better resource usage, especially for large projects
3. **Deployment**: Single binary, no Node.js runtime dependencies
4. **LSP ecosystem**: Growing number of excellent Go LSP implementations to learn from
5. **Learning is fun**: I wanted to get better at Go, and what better way than building something real?

That last point deserves elaboration. Coming from TypeScript, I'll admit there are things I miss — discriminated unions are *chef's kiss*, and generic methods would be nice. But programming idiomatic Go turned out to be a surprisingly pleasant, straightforward experience.

Here's the thing: Go isn't a language for clever people, and that's exactly why it's brilliant. When you're debugging at 2 AM (and let's be honest, we've all been there), you don't want to decipher someone's "elegant" abstraction. You want code that does what it says it does, clearly and obviously. Go delivers that in spades.

But what really won me over was the toolchain. Go's ecosystem feels like a real, globally-collaborative effort to build something genuinely nice. The standard library is thoughtfully designed, `go mod` actually works the way you'd expect, and tools like `go test -race` catch problems before they become production fires.

Compare that to npm... well, let's just say it's hard to go back. When your dependency tree doesn't look like the London Underground map and `go build` produces a single binary that just *works*, development becomes a lot more fun.

The goal wasn't to replace Matsuuu's work, but to explore a different implementation approach while building on his insights about what features matter most.

## Why This Matters for Your Daily Development

### For Custom Elements Developers
Remember the last time you were working on a web components project and had to:
- Manually look up attribute names in documentation
- Guess at slot names and hope for the best  
- Jump between files to find where an element was defined
- Wonder if you spelled `my-awesome-element` correctly

Those days are over. CEM Language Server makes working with custom elements feel like working with any other well-supported language.

### For Teams and Design Systems
If you're building a design system or component library, CEM Language Server gives your developers:
- **Instant feedback** on API usage
- **Consistent documentation** right in their editor
- **Fewer support tickets** about "how do I use this component?"
- **Faster onboarding** for new team members

### For the Web Components Ecosystem
Look, web components are finally hitting their stride. But tooling has been the Achilles' heel — you'd get great runtime performance but a medieval development experience. CEM Language Server (along with Matsuuu's original work) is part of changing that narrative.

When your editor understands your components as well as it understands JavaScript or CSS, web components stop feeling like a second-class citizen and start feeling like the future of web development they're meant to be.

## Get Started

Ready to supercharge your custom elements workflow? 

**Installation**: Grab the latest release from [the GitHub repo][cem] — it's a single binary with no dependencies, or [install][install] via npm or `go install`

**Editor Setup**: [Install and configure][lsp-setup] the appropriate LSP client plugin for your editor — we're launching with VS Code and Zed extensions, and support for Neovim and emacs!

**Configuration**: Point it at your Custom Element Manifest files and you're off to the races

**Documentation**: Full setup guides and configuration options are in the [README][cem]

## What's Next?

This is just the beginning. On the roadmap:

- **More editor support** (Sublime Text, etc.)
- **Workspace symbol search** (find any custom element across your entire project)
- **Code actions and refactoring** (rename a component and update all its usages)
- **Better Lit integration** (understanding template expressions and reactive properties)
- **Multi-manifest support** (for complex projects with multiple component libraries)

## The Real Talk

Building developer tools is hard. Building *good* developer tools is harder. But when you nail it — when autocomplete *just works*, when hover information is actually helpful, when go-to-definition takes you exactly where you expected — it's magic.

That's what CEM Language Server is aiming for. Not flashy magic, but the reliable, everyday magic that makes you more productive and less frustrated.

Huge thanks again to [Matsuuu][matsuuu] for blazing the trail and being an amazing collaborator. This tool exists because he proved it was possible and worth doing.

May your custom elements be discoverable, your attributes be well-documented, and your slots be perfectly named. 🚀

[cem]: https://github.com/bennypowers/cem
[cem-docs]: https://bennypowers.dev/cem/docs/lsp/
[matsuuu]: https://github.com/Matsuuu
[cels]: https://github.com/Matsuuu/custom-elements-language-server
[cem-format]: https://custom-elements-manifest.open-wc.org/
[lsp]: https://microsoft.github.io/language-server-protocol/
[tree-sitter]: https://tree-sitter.github.io/tree-sitter/
[install]: https://bennypowers.dev/cem/docs/installation/
[lsp-setup]: https://bennypowers.dev/cem/docs/lsp/#ide-setup
[vscode-ext]: https://marketplace.visualstudio.com/items?itemName=bennypowers.cem-language-server
[zed-ext]: https://github.com/zed-industries/zed/tree/main/extensions/cem
[nvim-setup]: https://bennypowers.dev/cem/docs/lsp/#neovim
[emacs-setup]: https://bennypowers.dev/cem/docs/lsp/#emacs
[discussions]: https://github.com/bennypowers/cem/discussions
