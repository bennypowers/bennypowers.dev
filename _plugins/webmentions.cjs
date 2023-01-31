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
function collateMentions(mentions) {
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
  eleventyConfig.addPairedShortcode('webmentions', async function(content, kwargs) {
    const { url, type, altUrls = [] } = kwargs;

    const target = new URL(url.replace(/index\.html$/, ''), domain).href;
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

    const { likes, reposts, replies } = collateMentions(mentions);

    switch(type) {
      case 'like': return !likes.length ? '' : /* html */`${content}
        <ul class="webmentions likes ${likes.length > 12 ? 'many' : ''}">${likes.map(mention => /* html */`
          <li class="webmention like">
            <a target="_blank" rel="noopener" href="${mention.author.url}">
              <img src="${mention.author.photo}" title="${mention.author.name}">
            </a>
          </li>`).join('\n')}
        </ul>`;
      case 'repost': return !reposts.length ? '' : /* html */`${content}
        <ul class="webmentions reposts ${reposts.length > 12 ? 'many' : ''}">${reposts.map(mention => /* html */`
          <li class="webmention repost">
            <a target="_blank" rel="noopener" href="${mention.author.url}">
              <img src="${mention.author.photo}" title="${mention.author.name}">
            </a>
          </li>`).join('\n')}
        </ul>`;
      case 'reply':
        return !replies.length ? '' : /* html */`
        <section class="webmentions replies">${content}${replies.map(mention => /* html */`
          <article class="webmention reply h-entry">
            <header class="p-author h-card">
              <a class="avatar" target="_blank" rel="noopener" href="${mention.author.url}">
                <img src="${mention.author.photo}" title="${mention.author.name}">
              </a>
              <span class="byline">
                <a target="_blank" rel="noopener" href="${mention.author.url}">
                  <h3 class="p-name">${mention.author.name}</h3>
                </a>
                <a class="u-in-reply-to" target="_blank" rel="noopener" href="${mention.url}">${prettyDate(mention.published ?? mention['wm-received'])}</a>
              </span>
            </header>
            <div class="comment p-name p-content">${mention.content.html}</div>
          </article>`).join('\n')}
        </section>`;
    }

    return '';
  });
}
