// https://kittygiraudel.com/2021/01/02/accessible-emojis-with-11ty/
// Thanks to Kitty Giraudel
//
const emojiRegex = require('emoji-regex')
const emojiShortName = require('emoji-short-name')

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig, { exclude }) {
  eleventyConfig.addTransform('emojis',
    /** @param {string} content */
    function (content) {
      if (!this.page.outputPath.endsWith?.('.html') || (exclude && this.page.outputPath.match?.(exclude))) {
        return content;
      } else {
        console.log(this.page.outputPath);
        return content.replace(emojiRegex(), function wrapEmoji(emoji) {
          const label = emojiShortName[emoji];
          return label
            ? `<span class="emoji" role="img" aria-label="${label}" title="${label}">${emoji}</span>`
            : `<span class="emoji">${emoji}</span>`
        });
      }
    });
}
