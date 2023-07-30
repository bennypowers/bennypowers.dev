const EleventyFetch = require('@11ty/eleventy-fetch');

class FedEmbed {
  constructor(props) {
    const { source, timeout, user, post } = props;
    try {
      this.post = new URL(post);
    } catch (_error) {}
  }

  async render() {
    switch (true) {
      case (!!this.user): return this.renderJSONFeed();
      case (!!this.post): return this.renderPost();
      default:
        console.error(`No valid URLs found on ${JSON.stringify(props)}`);
        break;
    }
  }

  async getPost() {
    const { origin, pathname } = this.post;
    let postURL;
    try {
      postURL = new URL(`${origin}/api/v1/statuses/${pathname.split('/').at(-1)}`);
    } catch (error) {
      console.error(error);
      return;
    }

    const { error, ...rest } = await this.fetch(postURL, { type: 'text' });

    if (error) {
      return console.error(error);
    } else {
      return rest;
    }
  }

  async renderPost() {
    return this.getPost()?.content ?? '';
  }

  async fetch(sourceURL, opts) {
    const type = opts?.type ?? 'json';
    const href = typeof sourceURL === 'string' ? sourceURL : sourceURL.href;
    const res = await EleventyFetch(href, { duration: '4w', type });
    return res;
  }
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addJavaScriptFunction('getFediPost', post =>
    new FedEmbed({ post }).getPost());
}

