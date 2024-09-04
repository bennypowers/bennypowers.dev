import type { UserConfig } from '@11ty/eleventy';
import markdownit from 'markdown-it';

export function RSSSummaryPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addFilter('rssSummary', (content: string, page: any) => {
    const { tldr, description } = page.data
    if (tldr ?? description)
      return markdownit().render(tldr ?? description);
    else
      return content;
  });
};

