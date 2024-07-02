/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function DC23Plugin(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./decks/devconf-brno-2023/components/*.css');
}
