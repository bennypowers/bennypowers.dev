const attrs = require('markdown-it-attrs');
const anchor = require('markdown-it-anchor');
const deflist = require('markdown-it-deflist');
const footnote = require('markdown-it-footnote');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.amendLibrary('md', /**@param{import('markdown-it')}md*/md =>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(footnote)
      .use(attrs, { allowedAttributes: [ 'id', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] }));
}
