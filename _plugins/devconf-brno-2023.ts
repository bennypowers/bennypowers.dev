import type { UserConfig } from '@11ty/eleventy';

export function DC23Plugin(eleventyConfig: UserConfig) {
  eleventyConfig.addPassthroughCopy('./decks/devconf-brno-2023/components/*.css');
}
