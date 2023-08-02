// https://kittygiraudel.com/2021/01/02/accessible-emojis-with-11ty/
// Thanks to Kitty Giraudel
//
const getRegex = require('emoji-regex')
const names = require('emoji-short-name')

const linkedom = require('linkedom');

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig, { exclude }) {
  eleventyConfig.addTransform('emojis',
    /** @param {string} content */
    function (content) {
      if (!this.page.outputPath.endsWith?.('.html') || (exclude && this.page.outputPath.match?.(exclude))) {
        return content;
      } else {
        const RE = getRegex();
        const { document, Node } = linkedom.parseHTML(content);
        document.querySelectorAll(':is(a, h1, h2, h3, h4, h5, h6, .magic-color, p)').forEach(el => {
          el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.match(RE)) {
              const cont = document.createElement('div');
              cont.innerHTML = node.nodeValue.replace(RE, emoji =>
                `<span class="emoji" role="img" aria-label="${names[emoji] ?? 'unknown emoji'}">${emoji}</span>`);
              node.replaceWith(...cont.childNodes);
            }
          });
        });
        return document.toString();
      }
      return content;
    });
}
