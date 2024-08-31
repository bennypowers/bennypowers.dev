import type { UserConfig } from '@11ty/eleventy';

import EleventyFetch from '@11ty/eleventy-fetch';

interface FedEmbedOptions {
  post: string;
}

class FedEmbed {
  post: URL;

  constructor(props: FedEmbedOptions) {
    const { post } = props;
    this.post = new URL(post);
  }

  async render() {
    switch (true) {
      case (!!this.post): return this.renderPost();
      default:
        console.error(`No valid URLs found on ${JSON.stringify(this.post.href)}`);
        break;
    }
  }

  async getPost() {
    const { origin, pathname } = this.post;
    let postURL: URL;
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
    const post = await this.getPost();
    return post?.content ?? '';
  }

  async fetch(sourceURL: URL, opts?: { type: string; }) {
    const type = opts?.type ?? 'json';
    const href = typeof sourceURL === 'string' ? sourceURL : sourceURL.href;
    const res = await EleventyFetch(href, { duration: '4w', type });
    return res;
  }
}

export function FedEmbedPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addJavaScriptFunction('getFediPost', async (post: string) => {
    if (post) {
      const embed = new FedEmbed({ post });
      const res = await embed.getPost();
      return res;
    }
  });
};

