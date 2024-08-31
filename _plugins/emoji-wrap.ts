import type { UserConfig } from '@11ty/eleventy';

import getRegex from 'emoji-regex';
import names from 'emoji-short-name';
import html from 'dedent';

import { parseHTML } from 'linkedom';

const RE = getRegex();

/**
 * Wrap emoji in a span with an image role and aria-label
 * Thanks to Kitty Giraudel
 * @see https://kittygiraudel.com/2021/01/02/accessible-emojis-with-11ty/
 */
export function EmojiWrapPlugin(eleventyConfig: UserConfig, { exclude }) {
  eleventyConfig.addTransform('emojis',
    function (content: string) {
      if (!this.page.outputPath.endsWith?.('.html')
          || (exclude && this.page.outputPath.match?.(exclude))) {
        return content;
      } else {
        const { document, Node } = parseHTML(content);
        document.querySelectorAll(':is(a, h1, h2, h3, h4, h5, h6, .magic-color, p)').forEach(el => {
          el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.match(RE)) {
              const cont = document.createElement('div');
              cont.innerHTML = node.nodeValue.replace(RE, emoji => html`
                <span class="emoji"
                      role="img"
                      aria-label="${names[emoji] ?? 'unknown emoji'}">${emoji}</span>`);
              node.replaceWith(...cont.childNodes);
            }
          });
        });
        return document.toString();
      }
    });
}
