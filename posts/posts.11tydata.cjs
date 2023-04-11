module.exports = {
  eleventyComputed: {
    async webmentions({ page, altUrls }) {
      if (page?.url) {
        const mentions = await this.getWebmentions(page.url, altUrls);
        return this.collateWebmentions(mentions);
      }
    }
  }
}
