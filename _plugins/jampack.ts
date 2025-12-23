import type { UserConfig } from '@11ty/eleventy';

import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(_exec);

export function JamPackPlugin(eleventyConfig: UserConfig, options: { exclude?: string | string[]; }) {
  eleventyConfig.ignores.add('.jampack/**/*');
  eleventyConfig.on('eleventy.after', async function({ runMode }) {
    if (runMode === 'build' && process.env.NO_JAMPACK !== 'true') {
      console.log('[jampack] starting...');
      let command = 'npx @divriots/jampack pack ./_site';

      if (options?.exclude) {
        const excludes = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
        for (const pattern of excludes) {
          command += ` --exclude "${pattern}"`;
        }
      }

      const start = performance.now();
      await exec(command);
      const delta = performance.now() - start;
      console.log(`[jampack] completed in ${(delta / 1000).toFixed(2)}s`);
    }
  })
}
