import type { UserConfig } from '@11ty/eleventy';
import type { Node, Element } from '@parse5/tools'
import type MarkdownIt from 'markdown-it';

import attrs from 'markdown-it-attrs';
import anchor from 'markdown-it-anchor';
import deflist from 'markdown-it-deflist';
import footnote from 'markdown-it-footnote';

import { parseFragment, serializeOuter } from 'parse5';
import { isElementNode, query, setAttribute } from '@parse5/tools';

const isPre = (node: Node): node is Element =>
     isElementNode(node)
  && node.tagName === 'pre'

function hoistFenceSlot(md: MarkdownIt) {
  const defaultFence = md.renderer.rules.fence!
      .bind(md.renderer.rules);
  md.renderer.rules.fence = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const slotName = token.attrGet('slot');
    const html = defaultFence(tokens, idx, options, env, self);
    if (slotName) {
      const document = parseFragment(html);
      const pre = query<Element>(document, isPre);
      if (slotName) {
        setAttribute(pre, 'slot', slotName);
      }
      return serializeOuter(pre);
    } else {
      return html
    }
  };
}

export function MarkdownTweaksPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.amendLibrary('md', (md: MarkdownIt)=>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(footnote)
      .use(attrs, { allowedAttributes: [ 'id', 'class', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] })
      .use(hoistFenceSlot));
}
