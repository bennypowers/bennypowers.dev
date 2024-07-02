import attrs from 'markdown-it-attrs';
import anchor from 'markdown-it-anchor';
import deflist from 'markdown-it-deflist';
import footnote from 'markdown-it-footnote';

/** @param{import('@11ty/eleventy').UserConfig} eleventyConfig */
export function MarkdownTweaksPlugin(eleventyConfig) {
  eleventyConfig.amendLibrary('md', /** @param {import('markdown-it')} md*/md =>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(footnote)
      .use(attrs, { allowedAttributes: [ 'id', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] }));
}
