import { parse } from 'yaml';

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function YAMLDataPlugin(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', /** @param {string} x */x => parse(x));
}
