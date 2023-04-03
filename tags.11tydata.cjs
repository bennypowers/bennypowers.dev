module.exports = {
  layout: 'base.webc',
  pagination: {
    data: 'collections',
    size: 1,
    alias: 'tag',
    filter: [
      'all',
      'posts',
      'resume-open-source',
      'resume-experience',
      'resume-education',
    ],
  },
  permalink({ tag }) { return `/tags/${this.slug(tag)}/`; },
  eleventyComputed: {
    title: x => x.tag,
    h1: x => `Posts Tagged with <code>${x.tag}</code>`,
    tagPageTag: x => x.tag,
  }
}
