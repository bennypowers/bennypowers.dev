module.exports = {
  permalink({ tag }) {
    if (!tag) return false;
    // Use encodeURIComponent to preserve distinction between "web components" and "web-components"
    const encoded = encodeURIComponent(tag);
    return `/tags/${encoded}/index.html`;
  },
  eleventyComputed: {
    title: x => x.tag,
    h1: x => `Posts Tagged with <code>${x.tag}</code>`,
    tagPageTag: x => x.tag,
  },
}
