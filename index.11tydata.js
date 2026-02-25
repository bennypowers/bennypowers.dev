export default {
  eleventyComputed: {
    async webmentions({ page }) {
      if (page?.url) {
        return await this.getWebmentions(page.url);
      }
    },
  },
};
