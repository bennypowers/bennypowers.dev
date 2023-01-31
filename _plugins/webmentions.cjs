// @ts-check
const EleventyFetch = require('@11ty/eleventy-fetch');
const TOKEN = 'zuu3pr1ps_Gt3fPKSTzWYg';

/** @param {import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig, { domain }) {
  eleventyConfig.addGlobalData('webmentions', async function() {
    return EleventyFetch(`https://webmention.io/api/mentions.jf2?token=${TOKEN}`, {
      duration: '1h',
      type: 'json',
      verbose: true,
    });
  });

  eleventyConfig.addPairedShortcode('webmentions', function(content, kwargs) {
    const { mentions, url, type } = kwargs;
    const webmentionUrl = url.replace(/index\.html$/, '');

    const { likes, reposts, replies } = mentions.children.reduce((acc, mention) => {
      if (mention['wm-target'] !== `${domain}${webmentionUrl}`) 
        return acc;
      else if (mention['wm-property'] === 'like-of')
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
          <article class="webmention reply">
            <header>
              <a class="avatar" target="_blank" rel="noopener" href="${mention.author.url}">
                <img src="${mention.author.photo}" title="${mention.author.name}">
              </a>
            <span class="byline">
              <a target="_blank" rel="noopener" href="${mention.author.url}">
                <h3>${mention.author.name}</h3>
              </a>
              <a target="_blank" rel="noopener" href="${mention.url}">${prettyDate(mention.published ?? mention['wm-received'])}</a>
            </span>
            </header>
            <div class="comment">${mention.content.html}</div>
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
