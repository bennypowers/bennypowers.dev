import type { UserConfig } from '@11ty/eleventy';

import EleventyFetch from '@11ty/eleventy-fetch';

export interface WebMentionAuthor {
  url: string;
  name: string;
  photo: string;
}

export interface WebMention {
  author: WebMentionAuthor;
  published: string;
  url: string;
  content: {
    html: string;
    text: string;
  };
  'wm-received': string;
  'like-of'?: string;
  'repost-of'?: string;
  'in-reply-to'?: string;
}

export interface WebMentionResponse {
  children: WebMention[];
}

const COLLATED: Map<
  string,
  Record<
    | 'likes'
    | 'replies'
    | 'reposts',
    WebMention[]>
  >
  = new Map();

function collateWebmentions(pageUrl: string, mentions: WebMention[]) {
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

function getWebmentions(eleventyConfig: UserConfig, domain: string) {
  return async function getWebmentions(pageUrl: string, altUrls: string[]) {
    const allWMs: WebMentionResponse = eleventyConfig.globalData.allWebmentions;
    const pageUrlRE = new RegExp(`^https?:\/\/${domain}${pageUrl}?`);
    const pageMentions = allWMs.children.filter(wm => {
      const target = wm['wm-target'];
      return pageUrlRE.test(target) || altUrls?.includes(target);
    });
    return collateWebmentions(pageUrl, pageMentions);
  }
}

export function WebmentionsPlugin(eleventyConfig: UserConfig, { domain, webmentionIoToken }) {
  eleventyConfig.on('eleventy.before', async function() {
    const start = performance.now();
    console.log('[webmentions]: Fetching webmentions...');
    const webmentionIoUrl = new URL('/api/mentions.jf2', 'https://webmention.io')
          webmentionIoUrl.searchParams.append('token', webmentionIoToken);
          webmentionIoUrl.searchParams.append('domain', domain);
    const mentions = await EleventyFetch(webmentionIoUrl.href, {
      duration: '1h',
      type: 'json',
      verbose: true,
    });
    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`[webmentions]: Fetched ${mentions?.children?.length ?? 0} mentions in ${elapsed}ms`);
    eleventyConfig.addGlobalData('allWebmentions', mentions);
  });
  eleventyConfig.addFilter('isWebmentionLike', mention => mention?.['wm-property'] === 'like-of');
  eleventyConfig.addFilter('isWebmentionRepost', mention => mention?.['wm-property'] === 'repost-of');
  eleventyConfig.addFilter('isWebmentionReply', mention => mention?.['wm-property'] === 'in-reply-to');
  eleventyConfig.addFilter('getWebmentions', getWebmentions(eleventyConfig, domain));
}
