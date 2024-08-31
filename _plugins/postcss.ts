import type { UserConfig } from '@11ty/eleventy';

import { Processor } from 'postcss';

import env from 'postcss-preset-env';

const processor = new Processor([
  env({
    stage: false,
    features: {
      'nesting-rules': true,
    }
  })
]);

export async function postcss(
  input: string | Promise<string>,
  from: string = this?.page?.inputPath,
) {
  try {
    const result = await processor.process(await input, { from });
    return result.css;
  } catch(e) {
    console.error(e);
    return input
  }
}

export function PostCSSPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addTemplateFormats('postcss');
  eleventyConfig.addExtension('postcss', {
    async compile(content: string, inputPath: string) {
      return () => postcss(content, inputPath);
    }
  });
  eleventyConfig.addFilter('postcss', postcss);
}
