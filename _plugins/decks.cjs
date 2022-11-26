const path = require('path');
const cheerio = require('cheerio');

module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection('slides', collectionApi => {
    const slides = collectionApi
      .getFilteredByGlob('./decks/*/slides/*.md')
      .map(x => Object.assign(x, {
        deck: x.data.page.filePathStem.split('/').at(2),
      }))
      .sort((a, b) =>
          a.inputPath < b.inputPath ? -1
        : a.inputPath > b.inputPath ? 1
        : 0)
    return slides;
  });

  eleventyConfig.addPassthroughCopy('decks/**/*.js');
  eleventyConfig.addPassthroughCopy('decks/**/*.css');
  eleventyConfig.addPassthroughCopy('decks/**/*.png');

  eleventyConfig.addFilter('reveal', function(content, selector) {
    if (!selector) return content;
    const $ = cheerio.load(content);
    $(selector).each(function() {
      const closest = $(this).closest('[slot="presenter"]');
      if (!closest.length)
        $(this).attr('reveal', '');
    });
    return $.html();
  });

  eleventyConfig.on('eleventy.before', async (e) => {
    console.log('[decks]: bundling with esbuild');

    const { build } = await import('esbuild');
    await build({
      bundle: true,
      outfile: '_site/assets/decks.min.js',
      minify: false,
      mangleQuoted: false,
      format: 'esm',
      stdin: {
        sourcefile: 'components.js',
        resolveDir: path.join(__dirname, '..', 'node_modules'),
        contents: `
import 'slidem';
import 'slidem/slidem-slide.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
`,
      }
    });
    console.log('  ...done');
  });
}
