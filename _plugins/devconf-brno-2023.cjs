/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./decks/devconf-brno-2023/components/*.css');
}
