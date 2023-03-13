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
 * @param {string} input
 */
async function postcss(input) {
  try {
    const result = await processor.process(input);
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
  eleventyConfig.addTemplateFormats('css');
  eleventyConfig.addExtension('css', {
    outputFileExtension: 'css',
    compile(input, from) {
      if (options.exclude && from.match(options.exclude)) return () => input;
      return async function({ page }) {
        try {
          const to = page.outputPath;
          const result = await processor.process(input, { from, to });
          return result.css;
        } catch(e) {
          // console.error(e)
        }
      }
    }
  });
  eleventyConfig.addFilter('postcss', postcss);
}

module.exports.postcss = postcss;
