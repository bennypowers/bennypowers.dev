import type { UserConfig } from '@11ty/eleventy';
import type { CollectionApi } from './posts.ts';

import { parseFragment, serialize } from 'parse5'
import { isElementNode, query, getTextContent } from '@parse5/tools'
import { readFile } from 'node:fs/promises';
import markdownit from 'markdown-it';

export function RSSSummaryPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addFilter('rssSummary', (content, page) => {
    const { tldr, description } = page.data
    if (tldr ?? description)
      return markdownit().render(tldr ?? description);
    else
      return content
  });
};

