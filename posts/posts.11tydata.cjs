const isWatching = () =>
  process.argv.includes('--serve') || process.argv.includes('--watch');

module.exports = {
  layout: 'post.html',
  date: 'Created',
  eleventyComputed: {
    permalink({ published, datePublished, permalink }) {
      return isWatching() || published && datePublished <= new Date() ? permalink : false;
    }
  }
}
