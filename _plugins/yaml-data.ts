import type { UserConfig } from '@11ty/eleventy';

import { parse } from 'yaml';

export function YAMLDataPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addDataExtension('yaml', (x: string) => parse(x));
}
