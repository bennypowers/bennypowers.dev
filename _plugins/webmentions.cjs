// @ts-check
const EleventyFetch = require('@11ty/eleventy-fetch');
const TOKEN = 'zuu3pr1ps_Gt3fPKSTzWYg';

/** @param {import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig, { domain }) {
  eleventyConfig.addPairedShortcode('webmentions', async function(content, kwargs) {
    const { url, type, altUrls = [] } = kwargs;

    const target = new URL(url.replace(/index\.html$/, ''), domain).href;
    const resourceUrl = new URL('/api/mentions.jf2', 'https://webmention.io')
          resourceUrl.searchParams.append('token', TOKEN);
          resourceUrl.searchParams.append('target[]', target);
    // Hoping one day to slurp up dev.to likes and comments this way, but for now,
    // adding them returns an empty list
    // for (const t of altUrls)
    //       resourceUrl.searchParams.append('target[]', target);

    const mentions = await EleventyFetch(resourceUrl.href, {
      duration: '1h',
      type: 'json',
      verbose: true,
    });

    const { likes, reposts, replies } = mentions.children.reduce((acc, mention) => {
      if (mention['wm-property'] === 'like-of')
        acc.likes.push(mention);
      else if (mention['wm-property'] === 'repost-of')
        acc.reposts.push(mention);
      else if (mention['wm-property'] === 'in-reply-to')
        acc.replies.push(mention);
      return acc;
    }, { likes: [], reposts: [], replies: []});

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

    function prettyDate(string) {
      return new Date(string).toLocaleString('en-US', {
        timeStyle: 'short',
        dateStyle: 'short',
      });
    }


    return '';
  });
}
