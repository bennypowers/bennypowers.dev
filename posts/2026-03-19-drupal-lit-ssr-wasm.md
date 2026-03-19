---
title: "Introducing Backlit: Lit SSR for Drupal, Hold the Node"
published: true
audience: Drupal admins, web component developers, performance enthusiasts
tldr: |
  In 2024 we server-rendered Lit web components in Drupal using a Node.js
  sidecar container. Now we can do it with a single Go binary that embeds
  a WASM module -- no Node.js, no containers, no external services. The
  Drupal module is called Backlit.
coverImageAlt: Drupal drop logo and Lit flame logo connected by a glowing WASM chip
coverImage: /assets/images/drupal-lit-ssr-wasm.png
tags:
  - drupal
  - web components
  - lit
  - ssr
---

Two years ago I wrote about [server rendering Lit web components with Drupal][prev-post]. The approach worked, but it required a Node.js HTTP service running alongside Drupal in a container. That meant Docker/Podman, networking between containers, and an extra process to manage. It was a proof of concept, and it felt like one.

Well, introducing [Backlit][backlit] -- a Drupal module that server-renders [Lit](https://lit.dev) web components with [Declarative Shadow DOM](https://html.spec.whatwg.org/multipage/scripting.html#attr-template-shadowrootmode). No Node.js, no containers, no external services. Two lines to install, zero infrastructure to maintain.

## What Backlit does

If your Drupal site uses Lit web components (from a design system, a custom theme, or anywhere else), those components normally render client-side: the browser downloads JavaScript, defines the custom elements, and paints the shadow DOM. Until that happens, users see a flash of unstyled content or an empty box.

Backlit moves that rendering to the server. When Drupal finishes building a page, Backlit pipes the HTML through a binary that injects each component's shadow DOM directly into the response as a `<template shadowrootmode="open">` element. The browser attaches the shadow root during HTML parsing -- before any JavaScript runs. Users see styled, laid-out content on first paint.

Disable JavaScript entirely. The components still render. That is the way of the Lit.

## Quick start

```sh
composer require bennypowers/backlit
drush en backlit
```

Composer downloads the right binary for your platform (linux, macOS, Windows; x64 and arm64). Drush enables the module. Done.

## What's different from the Node.js approach

The previous post drew three fair criticisms. Here's how Backlit addresses each.

**No more service to maintain.** The Node.js sidecar is gone. Backlit's binary is a static executable -- it starts on demand inside the PHP-FPM worker and dies with it. Nothing to monitor, restart, or deploy separately. `composer update` handles everything.

**Minimal overhead.** The Node.js approach added ~50ms and ~100MB per request. Backlit adds ~0.32ms per render after a one-time 350ms cold start per worker, with a much smaller memory footprint (the binary is ~9MB, the WASM instance is lightweight). With Drupal's page cache enabled, subsequent requests skip the binary entirely.

**Safe failure and author control.** If the binary is unavailable or returns an empty response, Backlit returns the original HTML unchanged -- SSR failure is invisible to end users. Beyond that, Backlit adds an "Enable SSR" checkbox to content types, so authors can disable SSR per-page. Not every layout needs shadow roots injected, and editorial teams should have the final say.

## Adding your components

Backlit doesn't ship with any component definitions. You provide them as plain JavaScript files -- the same LitElement classes you'd write for the browser, minus the `import` statements.

### Where to put them

Drop `.js` files in any of these locations (checked in order):

1. **`$settings['backlit']['components_dir']`** in `settings.php` -- explicit path
2. **Your active theme's `components/` directory** -- e.g., `themes/custom/my_theme/components/`
3. **Any custom module's `js/` directory** -- e.g., `modules/custom/my_ds/js/`

Backlit auto-discovers element names from `customElements.define()` calls. No further configuration needed.

### One caveat

The JS files can't use `import` statements that reference `'lit'` or other npm packages -- the WASM engine has no filesystem or module resolver. Instead, Backlit provides `LitElement`, `html`, `css`, `classMap`, `styleMap`, `repeat`, and `unsafeHTML` as globals. If your design system distributes pre-built single-file component definitions, they'll work as-is. If not, a quick `esbuild --bundle` strips the imports and produces a self-contained file.

The component source is sent with each render request, but the WASM engine only evaluates it on the first render -- after that, `customElements.get()` confirms the elements are already registered and skips the eval. Definitions stay warm across all subsequent renders. No build step, no npm, no bundler at deploy time.

## Administering Backlit

### Updating components

When your front-end team ships a new version of the design system:

1. Replace the JS files in your components directory with the updated versions
2. Clear Drupal's cache: `drush cr`

The next request restarts the binary with the new definitions. That's the entire update process. No `npm install`, no container rebuild, no deployment pipeline for a sidecar service.

### Updating the binary

When a new version of Backlit is released with engine improvements:

```sh
composer update bennypowers/backlit
drush cr
```

Composer downloads the updated binary. The cache rebuild ensures the old process is replaced.

### Monitoring

Backlit logs errors to Drupal's watchdog. If the binary fails to start (missing file, wrong permissions, unsupported platform), you'll see it in the Drupal logs. The page still renders -- just without DSD.

### Caching

Backlit runs on every uncached page response. If you have Drupal's Internal Page Cache or a reverse proxy (Varnish, Cloudflare) in front of your site, the rendered HTML (with DSD) is cached at that layer. Subsequent requests never hit the binary. This is the recommended production setup.

### Per-content control

Backlit adds an "Enable SSR" checkbox to all content types. It defaults to on. Authors can disable it for individual pages where SSR causes issues -- for example, if a component relies on client-side state that SSR can't replicate.

## When to use Backlit

Backlit is useful when:

- Your site uses a Lit-based design system (like [RHDS](https://ux.redhat.com), [Shoelace](https://shoelace.style), [Lion](https://lion-web.netlify.app/), or your own)
- You care about first-paint performance (LCP, CLS)
- You want web components to render without JavaScript (accessibility, SEO, slow connections)
- You don't want to run Node.js alongside Drupal

## How it works under the hood

The binary embeds a WASM module containing [QuickJS](https://bellard.org/quickjs/) (a lightweight JavaScript engine) running [`@lit-labs/ssr`](https://www.npmjs.com/package/@lit-labs/ssr). On startup, it reads your component JS files and evaluates them in QuickJS, registering custom elements. Then it enters a read loop: Drupal writes HTML to the binary's stdin (NUL-terminated), the binary renders every known custom element with Declarative Shadow DOM, and writes the result to stdout (also NUL-terminated).

```
Drupal (PHP) --stdin: HTML\0--> lit-ssr-runtime binary --> stdout: HTML-with-DSD\0
```

The WASM instance stays warm across renders. The ~350ms cold start is paid once per PHP-FPM worker. Every subsequent render: ~0.32ms.

The binary is built with [Go](https://go.dev) and [wazero](https://wazero.io) (a pure-Go WASM runtime -- no CGo, no system dependencies). It's statically linked and runs on any Linux, macOS, or Windows machine. Yes, we support Windows. No, we haven't tested it. Godspeed.

## Performance

| Metric | Node.js sidecar (2024) | Backlit (2026) |
|---|---|---|
| Cold start | ~500ms (Node.js boot + module load) | ~350ms (WASM compile, once per worker) |
| Per-render | ~50ms (HTTP roundtrip + render) | ~0.32ms (pipe I/O + render) |
| Dependencies | Node.js, npm, Docker/Podman | Single binary |
| Memory | ~100MB (Node.js heap) | ~9MB binary (not yet benchmarked at runtime) |

These numbers are from the builtin mode (compiled-in components) Go benchmark. Runtime mode -- which Backlit uses by default -- adds overhead for JSON serialization and source transmission, though it skips JS evaluation after the first render. Runtime mode benchmarks are on the to-do list.

## Limitations

This is a v0 release. Some honest caveats:

- **Lit only.** The SSR engine is `@lit-labs/ssr`, which understands Lit's template system. Vanilla custom elements, Stencil, FAST, or other frameworks won't render. If you're using a mixed component library, only the Lit-based elements get DSD.
- **`@lit-labs/ssr` is experimental.** The Lit team marks it as such. It doesn't support `@lit/context`, and some component patterns (anything that calls DOM APIs during server render) will fail. Components need to be [SSR-compatible](https://lit.dev/docs/ssr/authoring/).
- **Component JS must not import from `'lit'`.** The WASM engine provides Lit APIs (`LitElement`, `html`, `css`, etc.) as globals. Components that use these globals directly work fine. Components with `import { LitElement } from 'lit'` will fail because QuickJS has no module resolver for npm packages. If your design system distributes components as ES modules, strip the imports first (e.g., `esbuild --bundle` or a simple regex).
- **Source sent on every request.** The runtime CLI currently sends the full component JS source with each render payload. The WASM side skips re-evaluation, but the serialization overhead is still there. Easy fix for the next release: send source only on the first request.
- **No streaming.** The entire page HTML is buffered, piped through the binary, and buffered back. For very large pages this adds latency. Streaming SSR is technically possible but not implemented.
- **Single process.** One `lit-ssr-runtime` process per PHP-FPM worker. Under high concurrency, this could be a bottleneck. A pool-per-worker model is straightforward to add.

## Advanced: compiled mode

For sites where every millisecond counts, you can build a custom WASM module with your components baked in, skipping JS evaluation entirely:

1. Clone [lit-ssr-wasm][repo]
2. Write your components in `src/components/` (standard TypeScript with decorators)
3. Import them in `src/entry.ts`, add tag names to `KNOWN_ELEMENTS`
4. `npm run build` (requires [Javy][javy])
5. Build the CLI: `cd go && make linux-x64`
6. Replace the binary in Backlit's `bin/` directory

This is the "I have a build pipeline and I'm not afraid to use it" option. Most sites won't need it.

## Try the demo

The [drupal-lit-ssr-wasm][drupal-repo] repo has a fully working example with auto-install, demo content, and Docker Compose:

```sh
git clone https://github.com/bennypowers/drupal-lit-ssr-wasm
cd drupal-lit-ssr-wasm
./scripts/download-binary.sh v0.0.2
podman compose up
```

The first boot takes a few minutes (Drupal auto-installs via Drush). Browse to http://localhost:8888. The front page shows server-rendered web components. Disable JavaScript to verify.

## Live demo

The [lit-ssr-wasm demo][demo] runs the actual WASM modules directly in the browser using a minimal WASI shim. The compiled mode demo does not load any JavaScript definition of `<my-alert>` on the page -- the styles you see come entirely from Declarative Shadow DOM.

## What's next

Backlit is deliberately minimal. Future directions:

- Manage multiple `lit-ssr` processes (one per PHP-FPM worker) for parallel rendering
- Add a Drush command for pre-warming the WASM instance on deploy
- Drupal admin UI for managing component sources

The [Backlit module][backlit], the [lit-ssr-wasm engine][repo], and a [working Drupal demo][drupal-repo] are all on GitHub.

This is early days. I'd love to hear what breaks, what's missing, and what you'd build with it. [Open an issue][backlit-issues] on the Backlit repo, or on [lit-ssr-wasm][repo-issues] for the engine itself. PRs welcome. Bug reports welcomed even more warmly.

Thanks to [Steven Spriggs][zeroedin] for talking through the idea and vetting the approach with me. Steven built his own Go-based Lit SSR pipeline, golit, taking a different path to the same destination -- worth knowing about if Backlit's tradeoffs don't fit your setup.

Full disclosure: I built `lit-ssr-wasm` to scratch a completely different itch -- a live preview feature in [`cem serve`][cem]. Backlit happened because, once the WASM module existed, the Drupal integration practically wrote itself. Two years of "this should be simpler" collapsed into an afternoon. That's the thing about building on standards. WASM is to backend runtimes what web components are to the browser: write it once, run it anywhere, watch it quietly solve problems you weren't even trying to solve. I'll take it.

[prev-post]: /posts/drupal-lit-ssr/
[backlit]: https://github.com/bennypowers/backlit
[drupal-repo]: https://github.com/bennypowers/drupal-lit-ssr-wasm
[repo]: https://github.com/bennypowers/lit-ssr-wasm
[releases]: https://github.com/bennypowers/lit-ssr-wasm/releases
[demo]: https://bennypowers.github.io/lit-ssr-wasm/compiled.html
[javy]: https://github.com/bytecodealliance/javy
[wazero]: https://wazero.io
[extism]: https://extism.org
[wasmer-php]: https://github.com/wasmerio/wasmer-php
[backlit-issues]: https://github.com/bennypowers/backlit/issues
[repo-issues]: https://github.com/bennypowers/lit-ssr-wasm/issues
[cem]: https://github.com/break-stuff/cem-tools
[zeroedin]: https://github.com/zeroedin
