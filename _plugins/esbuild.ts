import type { UserConfig } from '@11ty/eleventy';

import { build } from 'esbuild';
import { litCssPlugin } from 'esbuild-plugin-lit-css';

export function EsbuildPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addTemplateFormats('ts');
  eleventyConfig.addExtension('ts', {
    outputFileExtension: 'js',
    compile(_inputContent: string, inputPath: string) {
      if (!inputPath.startsWith('./_elements/')) return;
      return async () => {
        const result = await build({
          entryPoints: [inputPath],
          bundle: false,
          write: false,
          format: 'esm',
          target: 'es2022',
          plugins: [
            litCssPlugin({ inline: true }),
          ],
        });
        return result.outputFiles?.[0]?.text ?? '';
      };
    },
  });
}
