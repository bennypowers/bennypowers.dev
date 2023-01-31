const EleventyFetch = require('@11ty/eleventy-fetch');
const TOKEN = 'zuu3pr1ps_Gt3fPKSTzWYg';

module.exports = function(eleventyConfig) {

  eleventyConfig.addGlobalData('webmentions', async function() {
    const url = (`https://webmention.io/api/mentions?token=${TOKEN}`)
    return EleventyFetch(url, {
      duration: '1h',
      type: 'json',
    });
  });

  eleventyConfig.addFilter('webmentionsByUrl', function(webmentions, url) {
    const allowedTypes = ['mention-of', 'in-reply-to', 'like-of', 'repost-of']

    const data = {
        'like-of': [],
        'repost-of': [],
        'in-reply-to': [],
    }

    const hasRequiredFields = entry => {
        const { author, published, content } = entry
        return author.name && published && content
    }

    const filtered = webmentions
        .filter(entry => entry['wm-target'] === `https://rknight.me${url}`)
        .filter(entry => allowedTypes.includes(entry['wm-property']))

    filtered.forEach(m => {
        if (data[m['wm-property']])
        {
            const isReply = m['wm-property'] === 'in-reply-to'
            const isValidReply = isReply && hasRequiredFields(m)
            if (isReply)
            {
                if (isValidReply)
                {
                    m.sanitized = sanitizeHTML(m.content.html)
                    data[m['wm-property']].unshift(m)
                }

                return
            }

            data[m['wm-property']].unshift(m)
        }
    })

    return data
  });
}
