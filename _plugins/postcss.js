import { Processor } from 'postcss';
import env from 'postcss-preset-env';

const processor = new Processor([
  env({
    stage: false,
    features: {
      "nesting-rules": true,
    }
  })
]);

/**
 * @param {string|Promise<string>} input
 * @param {string} from
 */
export async function postcss(input, from = this?.page?.inputPath) {
  try {
    const result = await processor.process(await input, { from });
    return result.css;
  } catch(e) {
    console.error(e);
    return input
  }
}

/**
 * @param {import('@11ty/eleventy').UserConfig} eleventyConfig
 */
export function PostCSSPlugin(eleventyConfig) {
  eleventyConfig.addTemplateFormats('postcss');
  eleventyConfig.addExtension('postcss', {
    /**
       * @param {string} content
       * @param {string} inputPath
       */
    async compile(content, inputPath) {
      return () => postcss(content, inputPath);
    }
  });
  eleventyConfig.addFilter('postcss', postcss);
}
