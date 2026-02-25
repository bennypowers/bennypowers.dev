import type { UserConfig } from '@11ty/eleventy';
import { transform } from 'esbuild';

export function EsbuildPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addTemplateFormats('ts');
  eleventyConfig.addExtension('ts', {
    outputFileExtension: 'js',
    compile(inputContent: string, inputPath: string) {
      if (!inputPath.startsWith('./_elements/')) return;
      return async () => {
        const result = await transform(inputContent, {
          loader: 'ts',
          format: 'esm',
          target: 'es2022',
        });
        return result.code;
      };
    },
  });
}
