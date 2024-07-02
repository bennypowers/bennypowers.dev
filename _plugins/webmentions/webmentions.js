// @ts-check
import EleventyFetch from '@11ty/eleventy-fetch';

/**
 * @typedef {object} WebMentionAuthor
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

/** @type {Map<string, Record<'likes'|'replies'|'reposts', WebMention[]>>} */
const COLLATED = new Map();

/**
 * @param {string} pageUrl
 * @param {WebMention[]} mentions
 */
function collateWebmentions(pageUrl, mentions) {
  if (!COLLATED.has(pageUrl)) {
    COLLATED.set(pageUrl, mentions.reduce((acc, mention) => {
      switch(mention['wm-property']) {
        case 'like-of': acc.likes.push(mention); break;
        case 'repost-of': acc.reposts.push(mention); break;
        case 'in-reply-to': acc.replies.push(mention); break;
      }
      return acc;
    }, { likes: [], reposts: [], replies: []}));
  }
  return COLLATED.get(pageUrl);
}

/**
 * @param {import('@11ty/eleventy').UserConfig} eleventyConfig
 * @param {string} domain
 */
function getWebmentions(eleventyConfig, domain) {
  /**
   * @param {string}   pageUrl
   * @param {string[]} altUrls
   */
  return async function getWebmentions(pageUrl, altUrls) {
    /** @type {WebMentionResponse} */
    const allWMs = eleventyConfig.globalData.allWebmentions;
    const pageUrlRE = new RegExp(`^https?:\/\/${domain}${pageUrl}?`);
    const pageMentions = allWMs.children.filter(wm => {
      const target = wm['wm-target'];
      return pageUrlRE.test(target) || altUrls?.includes(target);
    });
    return collateWebmentions(pageUrl, pageMentions);
  }
}

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function WebmentionsPlugin(eleventyConfig, { domain, webmentionIoToken }) {
  eleventyConfig.on('eleventy.before', async function() {
    const webmentionIoUrl = new URL('/api/mentions.jf2', 'https://webmention.io')
          webmentionIoUrl.searchParams.append('token', webmentionIoToken);
          webmentionIoUrl.searchParams.append('domain', domain);
    const mentions = await EleventyFetch(webmentionIoUrl.href, {
      duration: '1h',
      type: 'json',
      verbose: true,
    });
    eleventyConfig.addGlobalData('allWebmentions', mentions);
  });
  eleventyConfig.addFilter('isWebmentionLike', mention => mention?.['wm-property'] === 'like-of');
  eleventyConfig.addFilter('isWebmentionRepost', mention => mention?.['wm-property'] === 'repost-of');
  eleventyConfig.addFilter('isWebmentionReply', mention => mention?.['wm-property'] === 'in-reply-to');
  eleventyConfig.addFilter('getWebmentions', getWebmentions(eleventyConfig, domain));
}
