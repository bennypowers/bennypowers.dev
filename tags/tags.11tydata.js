export default {
  eleventyComputed: {
    permalink(data) {
      if (data.tag) {
        // Slugify: lowercase, replace spaces with hyphens
        const slug = data.tag.toLowerCase().replace(/\s+/g, '-');
        return `/tags/${slug}/`;
      }
      return data.permalink;
    }
  }
};
