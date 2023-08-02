module.exports = function(eleventyConfig) {
  eleventyConfig.addTransform('webc-dsd-slot-workaround', async function(content) {
    if (this.page.outputPath?.endsWith?.('.html')) {
      const { transform } = await import('./transform.js');
      return transform(content);
    }
    return content;
  });
}
