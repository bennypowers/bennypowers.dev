const POST_DATE_RE = /(?<prefix>^.*\/)(?<date>\d{4}-(?:[0]\d|1[0-2])-(?:[0-2]\d|3[01]))-(?<suffix>.+)/;

export default {
  eleventyComputed: {
    async webmentions({ page, altUrls }) {
      if (page?.url) {
        const mentions = await this.getWebmentions(page.url, altUrls);
        return mentions;
      }
    },
    datePublished({ datePublished, page }) {
      const { date } = page.inputPath?.match(POST_DATE_RE)?.groups ?? {};
      if (!datePublished && date)
        return new Date(date);
      else
        return datePublished;
    },
    permalink({ permalink, page }) {
      const match = page.inputPath.match(POST_DATE_RE);
      if (match && !page.filePathStem.endsWith('/index'))
        return `${page.filePathStem}/index.html`
      else
        return permalink
    }
  }
}
