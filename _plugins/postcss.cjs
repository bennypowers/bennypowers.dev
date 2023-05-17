const { Processor } = require('postcss');
const env = require('postcss-preset-env');

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
async function postcss(input, from = this.page?.inputPath) {
  try {
    const result = await processor.process(await input, { from });
    return result.css;
  } catch(e) {
    console.error(e);
    return input
  }
}

/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 * @param{*} options
 */
module.exports = function(eleventyConfig, options) {
  eleventyConfig.addTemplateFormats('postcss');
  eleventyConfig.addExtension('postcss', {
    async compile(content, inputPath) {
      return () => postcss(content, inputPath);
    }
  });
  eleventyConfig.addFilter('postcss', postcss);
}

module.exports.postcss = postcss;
