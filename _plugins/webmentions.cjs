// @ts-check
const EleventyFetch = require('@11ty/eleventy-fetch');

/** @typedef {object} WebMentionAuthor
 * @property {string} url
 * @property {string} name
 * @property {string} photo
 */

/**
 * @typedef {object} WebMention
 * @property {WebMentionAuthor} author
 * @property {string} published
 * @property {string} url
 * @property {{ html: string; text: string; }} content
 * @property {string} wm-received
 * @property {'like-of'|'repost-of'|'in-reply-to'} wm-property
 */

/** @typedef {object} WebMentionResponse
 * @property {WebMention[]} children
 */

/** @type {WeakMap<WebMentionResponse, Record<'likes'|'replies'|'reposts', WebMention[]>>} */
const COLLATED = new WeakMap();

/**
 * @param {WebMentionResponse} mentions
 */
function collateWebmentions(mentions) {
  if (!COLLATED.has(mentions)) {
    COLLATED.set(mentions, mentions.children.reduce((acc, mention) => {
      switch(mention['wm-property']) {
        case 'like-of': acc.likes.push(mention); break;
        case 'repost-of': acc.reposts.push(mention); break;
        case 'in-reply-to': acc.replies.push(mention); break;
      }
      return acc;
    }, { likes: [], reposts: [], replies: []}));
  }
  return COLLATED.get(mentions);
}

/** @param {string | number | Date} string */
function prettyDate(string) {
  return new Date(string).toLocaleString('en-US', {
    timeStyle: 'short',
    dateStyle: 'short',
  });
}


/** @param {import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig, { domain, webmentionIoToken }) {
  eleventyConfig.addFilter('prettyDate', prettyDate);
  eleventyConfig.addFilter('collateWebmentions', collateWebmentions);
  eleventyConfig.addFilter('isWebmentionLike', mention => mention?.['wm-property'] === 'like-of');
  eleventyConfig.addFilter('isWebmentionRepost', mention => mention?.['wm-property'] === 'repost-of');
  eleventyConfig.addFilter('isWebmentionReply', mention => mention?.['wm-property'] === 'in-reply-to');
  eleventyConfig.addFilter('getWebmentions', async function(pageUrl, altUrls) {
    const target = new URL(pageUrl.replace(/index\.html$/, ''), domain).href;
    const webmentionIoUrl = new URL('/api/mentions.jf2', 'https://webmention.io')
          webmentionIoUrl.searchParams.append('token', webmentionIoToken);
          webmentionIoUrl.searchParams.append('target[]', target);
    // Hoping one day to slurp up dev.to likes and comments this way, but for now,
    // adding them returns an empty list
    // for (const t of altUrls.filter(x => !x.startsWith('https://dev.to')))
    //       resourceUrl.searchParams.append('target[]', target);

    /** @type {WebMentionResponse} */
    const mentions = await EleventyFetch(webmentionIoUrl.href, {
      duration: '1h',
      type: 'json',
      verbose: true,
    });

    return mentions;
  });
}
