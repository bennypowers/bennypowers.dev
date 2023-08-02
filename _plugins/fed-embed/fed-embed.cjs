const EleventyFetch = require('@11ty/eleventy-fetch');

class FedEmbed {
  constructor(props) {
    const { post } = props;
    this.post = new URL(post);
  }

  async render() {
    switch (true) {
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

    const res = await this.fetch(postURL);

    if (res.error) {
      throw new Error(res.error);
    } else {
      return res;
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
  eleventyConfig.addJavaScriptFunction('getFediPost', async post => {
    if (post) {
      const embed = new FedEmbed({ post });
      const res = await embed.getPost();
      return res;
    }
  });
};

