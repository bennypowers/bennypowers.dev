const cheerio = require('cheerio');
const fs = require('node:fs/promises');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addExtension('svg', {
    compile: x => () => x,
    compileOptions: {
      permalink() {
        return () => false;
      }
    },
    async getData(inputPath) {
      const content = await fs.readFile(inputPath, 'utf-8');
      const $ = cheerio.load(content);
      const title = $('title').text();
      console.log(inputPath, title);
      return { title };
    }
  });
  eleventyConfig.addShortcode('icon', function icon(name, kwargs) {
    this.ctx.page.icons ||= new Set();
    this.ctx.page.icons.add(name);
    const { __keywords, ...attrs } = kwargs ?? {}
    const attributes =
      Object.entries(attrs)
        .map(([name, value]) => ` ${name}="${value}"`)
        .join('');
    return `<svg ${attributes}><use href="#${name}-icon"></use></svg>`;
  });
};

