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
  'wm-property'?: string;
  'wm-target'?: string;
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
        case 'mention-of': acc.replies.push(mention); break;
      }
      return acc;
    }, { likes: [], reposts: [], replies: []}));
  }
  return COLLATED.get(pageUrl);
}

function getWebmentions(eleventyConfig: UserConfig, domain: string) {
  return async function getWebmentions(pageUrl: string, altUrls: string[]) {
    const allWMs: WebMentionResponse = eleventyConfig.globalData.allWebmentions;
    const pageUrlRE = new RegExp(`^https?:\/\/${domain}${pageUrl}?$`);
    const pageMentions = allWMs.children.filter(wm => {
      const target = wm['wm-target'];
      return pageUrlRE.test(target) || altUrls?.includes(target);
    });
    return collateWebmentions(pageUrl, pageMentions);
  }
}

/** Match bsky.app post URLs — captures DID and rkey */
const BSKY_POST_RE = /^https:\/\/bsky\.app\/profile\/(did:[^/]+)\/post\/([\w]+)$/;

/** Convert a bsky.app post URL to an AT Protocol URI */
function bskyUrlToAtUri(url: string): string | null {
  const m = url.match(BSKY_POST_RE);
  if (!m) return null;
  return `at://${m[1]}/app.bsky.feed.post/${m[2]}`;
}

/** Convert a Bluesky thread post to a bsky.app URL */
function atUriToBskyUrl(uri: string): string {
  // at://did:plc:xxx/app.bsky.feed.post/rkey -> https://bsky.app/profile/did:plc:xxx/post/rkey
  const m = uri.match(/^at:\/\/(did:[^/]+)\/app\.bsky\.feed\.post\/(.+)$/);
  if (!m) return uri;
  return `https://bsky.app/profile/${m[1]}/post/${m[2]}`;
}

interface BskyThreadPost {
  $type: string;
  post: {
    uri: string;
    cid: string;
    author: {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
    };
    record: {
      text: string;
      createdAt: string;
    };
    likeCount?: number;
    repostCount?: number;
    replyCount?: number;
    indexedAt: string;
  };
  replies?: BskyThreadPost[];
}

/** Recursively collect all reply posts from a Bluesky thread */
function flattenReplies(thread: BskyThreadPost): BskyThreadPost['post'][] {
  const results: BskyThreadPost['post'][] = [];
  for (const reply of thread.replies ?? []) {
    if (reply.$type !== 'app.bsky.feed.defs#threadViewPost') continue;
    results.push(reply.post);
    results.push(...flattenReplies(reply));
  }
  return results;
}

/** Convert a Bluesky post into a synthetic WebMention */
function bskyPostToWebMention(
  post: BskyThreadPost['post'],
  wmTarget: string,
  wmProperty: string,
): WebMention {
  return {
    author: {
      name: post.author.displayName || post.author.handle,
      url: `https://bsky.app/profile/${post.author.handle}`,
      photo: post.author.avatar ?? '',
    },
    published: post.record.createdAt,
    url: atUriToBskyUrl(post.uri),
    content: {
      text: post.record.text,
      html: post.record.text,
    },
    'wm-received': post.indexedAt,
    'wm-property': wmProperty,
    'wm-target': wmTarget,
  };
}

/** Fetch Bluesky thread replies and likes for webmentions that came from bsky.app */
async function fetchBskyThreads(mentions: WebMentionResponse): Promise<void> {
  const bskyMentions = mentions.children.filter(wm => BSKY_POST_RE.test(wm.url));
  if (!bskyMentions.length) return;

  // Track URLs we already have to avoid duplicates
  const existingUrls = new Set(mentions.children.map(wm => wm.url));
  let added = 0;

  for (const wm of bskyMentions) {
    const atUri = bskyUrlToAtUri(wm.url);
    if (!atUri) continue;
    const target = wm['wm-target'];

    try {
      // Fetch the thread with replies
      const thread: { thread: BskyThreadPost } = await EleventyFetch(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(atUri)}&depth=6`,
        { duration: '1h', type: 'json' },
      );

      // Add thread replies as synthetic webmentions
      const replies = flattenReplies(thread.thread);
      for (const reply of replies) {
        const replyUrl = atUriToBskyUrl(reply.uri);
        if (existingUrls.has(replyUrl)) continue;
        existingUrls.add(replyUrl);
        mentions.children.push(bskyPostToWebMention(reply, target, 'in-reply-to'));
        added++;
      }

      // Fetch likes on this post
      const likes: { likes: Array<{ actor: BskyThreadPost['post']['author']; createdAt: string }> } = await EleventyFetch(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getLikes?uri=${encodeURIComponent(atUri)}&limit=100`,
        { duration: '1h', type: 'json' },
      );

      for (const like of likes.likes ?? []) {
        const likeUrl = `${wm.url}#liked_by_${like.actor.did}`;
        if (existingUrls.has(likeUrl)) continue;
        existingUrls.add(likeUrl);
        mentions.children.push({
          author: {
            name: like.actor.displayName || like.actor.handle,
            url: `https://bsky.app/profile/${like.actor.handle}`,
            photo: like.actor.avatar ?? '',
          },
          published: like.createdAt,
          url: likeUrl,
          content: { text: '', html: '' },
          'wm-received': like.createdAt,
          'wm-property': 'like-of',
          'wm-target': target,
        });
        added++;
      }
    } catch (e) {
      console.log(`[webmentions]: Failed to fetch Bluesky thread for ${wm.url}: ${(e as Error).message}`);
    }
  }

  if (added > 0) {
    console.log(`[webmentions]: Added ${added} Bluesky thread replies/likes`);
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

    // Enrich with Bluesky thread replies and likes
    await fetchBskyThreads(mentions);

    eleventyConfig.addGlobalData('allWebmentions', mentions);
  });
  eleventyConfig.addFilter('isWebmentionLike', mention => mention?.['wm-property'] === 'like-of');
  eleventyConfig.addFilter('isWebmentionRepost', mention => mention?.['wm-property'] === 'repost-of');
  eleventyConfig.addFilter('isWebmentionReply', mention => mention?.['wm-property'] === 'in-reply-to' || mention?.['wm-property'] === 'mention-of');
  eleventyConfig.addFilter('resolveBridgyMentions', (html: string) =>
    (html ?? '').replace(/@([\w.-]+)\.web\.brid\.gy/g, '@$1'));
  eleventyConfig.addFilter('getWebmentions', getWebmentions(eleventyConfig, domain));
}
