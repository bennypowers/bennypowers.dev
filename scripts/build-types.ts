import { $ } from 'execa';
import Manifest from '../package.json' with { type: 'json' };

// 11ty doesn't actually export this type, so we have to make use
// of our private knowledge of 11ty guts, if we want to have cognitive a11y
// in our config files.
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
