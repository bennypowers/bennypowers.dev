module.exports = {
  permalink({ pagination, tag }) {
    return !tag ? '/tags/index.html' : `/tags/${this.slug(tag)}/index.html`;
  },
  eleventyComputed: {
    title: x => x.tag,
    h1: x => `Posts Tagged with <code>${x.tag}</code>`,
    tagPageTag: x => x.tag,
  },
}
