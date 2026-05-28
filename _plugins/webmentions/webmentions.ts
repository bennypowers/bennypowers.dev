import type { UserConfig } from '@11ty/eleventy';

import EleventyFetch from '@11ty/eleventy-fetch';

const BLOCKED_AUTHORS = new Set([
  'https://dev.to/amos_joseph',
  'https://dev.to/swetha_hopeinfotech_6c729',
]);

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
      if (BLOCKED_AUTHORS.has(wm.author?.url)) return false;
      const target = wm['wm-target'];
      return pageUrlRE.test(target) || altUrls?.includes(target);
    });
    return collateWebmentions(pageUrl, pageMentions);
  }
}

interface MastodonAccount {
  display_name: string;
  url: string;
  avatar: string;
}

interface MastodonStatus {
  id: string;
  url: string;
  content: string;
  created_at: string;
  favourites_count: number;
  reblogs_count: number;
  replies_count: number;
  in_reply_to_id: string | null;
  account: MastodonAccount;
}

interface MastodonContext {
  ancestors: MastodonStatus[];
  descendants: MastodonStatus[];
}

const MASTODON_INSTANCE = 'https://social.bennypowers.com';
const MASTODON_ACCOUNT_ID = '9v57c4n8bptd0iia';

function mastodonPostToWebMention(
  status: MastodonStatus,
  wmTarget: string,
  wmProperty: string,
): WebMention {
  return {
    author: {
      name: status.account.display_name || status.account.url,
      url: status.account.url,
      photo: status.account.avatar ?? '',
    },
    published: status.created_at,
    url: status.url,
    content: {
      html: status.content,
      text: status.content.replace(/<[^>]+>/g, ''),
    },
    'wm-received': status.created_at,
    'wm-property': wmProperty,
    'wm-target': wmTarget,
  };
}

function mastodonAccountToWebMention(
  account: MastodonAccount,
  statusUrl: string,
  createdAt: string,
  wmTarget: string,
  wmProperty: string,
): WebMention {
  return {
    author: {
      name: account.display_name || account.url,
      url: account.url,
      photo: account.avatar ?? '',
    },
    published: createdAt,
    url: `${statusUrl}#${wmProperty}_by_${encodeURIComponent(account.url)}`,
    content: { text: '', html: '' },
    'wm-received': createdAt,
    'wm-property': wmProperty,
    'wm-target': wmTarget,
  };
}

/** Extract blog post URLs from Mastodon status HTML content */
function extractBlogUrls(content: string, domain: string): string[] {
  const urls: string[] = [];
  const re = new RegExp(`https?://${domain.replace('.', '\\.')}/[^"<\\s]+`, 'g');
  for (const match of content.matchAll(re)) {
    try {
      const url = new URL(match[0]);
      url.hash = '';
      url.search = '';
      const normalized = url.href.replace(/\/+$/, '/');
      if (!urls.includes(normalized))
        urls.push(normalized);
    } catch { /* skip malformed */ }
  }
  return urls;
}

/** Fetch fediverse threads for posts linking to the blog */
async function fetchMastodonThreads(
  mentions: WebMentionResponse,
  domain: string,
): Promise<void> {
  const existingUrls = new Set(mentions.children.map(wm => wm.url));
  let added = 0;

  try {
    const statuses: MastodonStatus[] = await EleventyFetch(
      `${MASTODON_INSTANCE}/api/v1/accounts/${MASTODON_ACCOUNT_ID}/statuses?limit=40&exclude_replies=true&exclude_reblogs=true`,
      { duration: '1h', type: 'json' },
    );

    const blogStatuses = statuses.filter(s => s.content.includes(domain));

    for (const status of blogStatuses) {
      const blogUrls = extractBlogUrls(status.content, domain);
      if (!blogUrls.length) continue;

      const wmTarget = blogUrls[0];

      // Fetch reply thread
      try {
        const context: MastodonContext = await EleventyFetch(
          `${MASTODON_INSTANCE}/api/v1/statuses/${status.id}/context`,
          { duration: '1h', type: 'json' },
        );

        for (const reply of context.descendants) {
          if (existingUrls.has(reply.url)) continue;
          existingUrls.add(reply.url);
          mentions.children.push(mastodonPostToWebMention(reply, wmTarget, 'in-reply-to'));
          added++;
        }
      } catch (e) {
        console.log(`[webmentions]: Failed to fetch Mastodon thread for ${status.url}: ${(e as Error).message}`);
      }

      // Fetch favourites
      if (status.favourites_count > 0) {
        try {
          const favs: MastodonAccount[] = await EleventyFetch(
            `${MASTODON_INSTANCE}/api/v1/statuses/${status.id}/favourited_by?limit=80`,
            { duration: '1h', type: 'json' },
          );
          for (const account of favs) {
            const favUrl = `${status.url}#liked_by_${encodeURIComponent(account.url)}`;
            if (existingUrls.has(favUrl)) continue;
            existingUrls.add(favUrl);
            mentions.children.push(mastodonAccountToWebMention(account, status.url, status.created_at, wmTarget, 'like-of'));
            added++;
          }
        } catch (e) {
          console.log(`[webmentions]: Failed to fetch Mastodon favourites for ${status.url}: ${(e as Error).message}`);
        }
      }

      // Fetch boosts
      if (status.reblogs_count > 0) {
        try {
          const boosts: MastodonAccount[] = await EleventyFetch(
            `${MASTODON_INSTANCE}/api/v1/statuses/${status.id}/reblogged_by?limit=80`,
            { duration: '1h', type: 'json' },
          );
          for (const account of boosts) {
            const boostUrl = `${status.url}#repost_by_${encodeURIComponent(account.url)}`;
            if (existingUrls.has(boostUrl)) continue;
            existingUrls.add(boostUrl);
            mentions.children.push(mastodonAccountToWebMention(account, status.url, status.created_at, wmTarget, 'repost-of'));
            added++;
          }
        } catch (e) {
          console.log(`[webmentions]: Failed to fetch Mastodon boosts for ${status.url}: ${(e as Error).message}`);
        }
      }
    }
  } catch (e) {
    console.log(`[webmentions]: Failed to fetch Mastodon statuses: ${(e as Error).message}`);
  }

  if (added > 0)
    console.log(`[webmentions]: Added ${added} Mastodon thread replies/likes/boosts`);
}

interface DevToArticle {
  id: number;
  url: string;
  canonical_url: string;
  comments_count: number;
  published_at: string;
}

interface DevToComment {
  id_code: string;
  body_html: string;
  created_at: string;
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
  children: DevToComment[];
}

function flattenDevToComments(comments: DevToComment[]): DevToComment[] {
  const results: DevToComment[] = [];
  for (const comment of comments) {
    results.push(comment);
    results.push(...flattenDevToComments(comment.children ?? []));
  }
  return results;
}

function devToCommentToWebMention(
  comment: DevToComment,
  articleUrl: string,
  wmTarget: string,
): WebMention {
  return {
    author: {
      name: comment.user.name,
      url: `https://dev.to/${comment.user.username}`,
      photo: comment.user.profile_image ?? '',
    },
    published: comment.created_at,
    url: `${articleUrl}#comment-${comment.id_code}`,
    content: {
      html: comment.body_html,
      text: comment.body_html.replace(/<[^>]+>/g, '').trim(),
    },
    'wm-received': comment.created_at,
    'wm-property': 'in-reply-to',
    'wm-target': wmTarget,
  };
}

async function fetchDevToComments(
  mentions: WebMentionResponse,
  domain: string,
  devToToken: string,
): Promise<void> {
  if (!devToToken) return;

  const existingUrls = new Set(mentions.children.map(wm => wm.url));
  let added = 0;

  try {
    const articles: DevToArticle[] = await EleventyFetch(
      'https://dev.to/api/articles?username=bennypowers&per_page=100',
      { duration: '1h', type: 'json', fetchOptions: { headers: { 'api-key': devToToken } } },
    );

    const blogArticles = articles.filter(a =>
      a.canonical_url?.includes(domain) && a.comments_count > 0
    );

    for (const article of blogArticles) {
      try {
        const comments: DevToComment[] = await EleventyFetch(
          `https://dev.to/api/comments?a_id=${article.id}`,
          { duration: '1h', type: 'json', fetchOptions: { headers: { 'api-key': devToToken } } },
        );

        for (const comment of flattenDevToComments(comments)) {
          const authorUrl = `https://dev.to/${comment.user.username}`;
          if (BLOCKED_AUTHORS.has(authorUrl)) continue;
          const commentUrl = `${article.url}#comment-${comment.id_code}`;
          if (existingUrls.has(commentUrl)) continue;
          existingUrls.add(commentUrl);
          mentions.children.push(devToCommentToWebMention(comment, article.url, article.canonical_url));
          added++;
        }
      } catch (e) {
        console.log(`[webmentions]: Failed to fetch dev.to comments for ${article.url}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    console.log(`[webmentions]: Failed to fetch dev.to articles: ${(e as Error).message}`);
  }

  if (added > 0)
    console.log(`[webmentions]: Added ${added} dev.to comments`);
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

export function WebmentionsPlugin(eleventyConfig: UserConfig, { domain, webmentionIoToken, devToToken }) {
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

    await Promise.all([
      fetchBskyThreads(mentions),
      fetchMastodonThreads(mentions, domain),
      fetchDevToComments(mentions, domain, devToToken),
    ]);

    eleventyConfig.addGlobalData('allWebmentions', mentions);
  });
  eleventyConfig.addFilter('isWebmentionLike', mention => mention?.['wm-property'] === 'like-of');
  eleventyConfig.addFilter('isWebmentionRepost', mention => mention?.['wm-property'] === 'repost-of');
  eleventyConfig.addFilter('isWebmentionReply', mention => mention?.['wm-property'] === 'in-reply-to' || mention?.['wm-property'] === 'mention-of');
  eleventyConfig.addFilter('resolveBridgyMentions', (html: string) =>
    (html ?? '').replace(/@([\w.-]+)\.web\.brid\.gy/g, '@$1'));
  eleventyConfig.addFilter('getWebmentions', getWebmentions(eleventyConfig, domain));
}
