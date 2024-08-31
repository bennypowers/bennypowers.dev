import type { UserConfig } from '@11ty/eleventy';
import type MarkdownIt from 'markdown-it';

import attrs from 'markdown-it-attrs';
import anchor from 'markdown-it-anchor';
import deflist from 'markdown-it-deflist';
import footnote from 'markdown-it-footnote';

export function MarkdownTweaksPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.amendLibrary('md', (md: MarkdownIt)=>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(footnote)
      .use(attrs, { allowedAttributes: [ 'id', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] }));
}
