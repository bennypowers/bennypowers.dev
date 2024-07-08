/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function WebCDSDWorkaroundPlugin(eleventyConfig) {
  eleventyConfig.addTransform('webc-dsd-slot-workaround', async function(content) {
    if (this.page.outputPath?.endsWith?.('.html')) {
      const { transform } = await import('./transform.js');
      return transform(content);
    }
    return content;
  });
}
