---
title: Typescript Eleventy Config
published: true
tags:
  - eleventy
  - typescript
tldr: >
  Node 22.6 introduced the --experimental-strip-types flag, and eleventy 3.0.0
  adds support for JavaScript module configs, which means we can set up an 11ty
  project written in TypeScript using esm and build it without tsc.
coverImageAlt: >-
  disabled programmer typing at a computer, the keyboard is at his fingers.
  he has a huge smile on his face, the screen is glowing brightly, butterflies
  and small birds are flying circles around the crt monitor
coverImage: /assets/images/eleventy-typescript-config.png
---

There are a bunch of guides out there explaining how to write 11ty configs in typescript
so that you can compile them prior to running 11ty. This isn't one of those. I'm here to
explain how to run eleventy *on your typescript configs*, with all the familiar editor
ergonomics, without building your config files at all. Dev time, meet runtime.

You'll need node.js 22.6 or later, which adds the [`--experimental-strip-types`][strip] flag.
What this does is tell node to just ignore typescript syntax, as if it was a comment. Node
here is basically implementing the [types as comments proposal][proposal], and I hope everyone
else follows suit quickly.

## Doing the Cool Kids' Homework

Now, 11ty follows the [types-in-jsdoc][jsdoc] approach, which is fine i guess whatever, but
for some reason, they don't then ship those types in `.d.ts` files, so we'll have to build them
ourselves. Run this script in `postinstall`:

```typescript
import { $ } from 'execa';

import Manifest from '../package.json' with { type: 'json' };

await $`npx tsc node_modules/@11ty/eleventy/src/UserConfig.js
        --declaration
        --allowJs
        --emitDeclarationOnly
        --moduleResolution nodenext
        --module nodenext
        --target esnext`;

for (const pkg in Manifest.dependencies) {
  if (pkg.startsWith('@11ty')) {
    const spec = import.meta.resolve(pkg).replace('file://', '');
    try {
      await $`npx tsc ${spec}
              --declaration
              --allowJs
              --emitDeclarationOnly
              --moduleResolution nodenext
              --module nodenext
              --target esnext`;
    } catch(e) {
      console.log(e.stdout);
    }
    console.log(`Wrote types for ${pkg}`)
  }
}
```

Shipping `.d.ts` type declarations in your npm library is an accessibility issue.
Your users with cognitive disabilities like ADHD can't afford to keep alt-tabbing
back to your docs site. I hope the 11ty authors will integrate this into their
build system soon.

## TypeScript, Ho!

That having been accomplished, rename your config file and import the UserConfig type:

```sh
mv eleventy.config.js eleventy.config.ts
```

```ts
import type { UserConfig } from '@11ty/eleventy';

export default function(eleventyConfig: UserConfig) {
  eleventyConfig.
}
```

And watch those LSP-completion suggestions roll in.

If you have split your config into multiple files, you need to enable `.ts` extension in your `tsconfig.json`.
Also disable emit, because we're not actually running `tsc` at any point, this is all for neovim.

Here, crib mine:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "target": "ESNext",
    "noEmit": true
  }
}
```

Last thing is to actually run it, and to do that we'll use the `NODE_OPTIONS` environment variable

```json
"scripts": {
  "build": "NODE_OPTIONS='--experimental-strip-types' eleventy --config=eleventy.config.ts --incremental",
  "start": "NODE_OPTIONS='--experimental-strip-types' eleventy --config=eleventy.config.ts --serve --incremental"
},
```

## Gimmie the Code

And that's pretty much it! I accomplished the above on this site in commit [307e5cf8][commit], 
which you're welcome to ogle over at Microsoft's loss-leader code scraping utility.

[strip]: https://nodejs.org/en/blog/release/v22.6.0#experimental-typescript-support-via-strip-types
[proposal]: https://tc39.es/proposal-type-annotations/
[jsdoc]: https://dev.to/dakmor/type-safe-web-components-with-jsdoc-4icf
[commit]: https://github.com/bennypowers/bennypowers.dev/commit/307e5cf8a9306fe8a0e08af209263b32a8051887
