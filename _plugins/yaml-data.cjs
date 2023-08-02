const YAML = require('yaml');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
}
