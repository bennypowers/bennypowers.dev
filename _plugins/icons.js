import { load } from 'cheerio';
import { readFile } from 'node:fs/promises';

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function IconsPlugin(eleventyConfig) {
  eleventyConfig.addExtension('svg', {
    compile: x => () => x,
    compileOptions: {
      permalink() {
        return () => false;
      }
    },
    /**
     * @param {string} inputPath
     */
    async getData(inputPath) {
      const content = await readFile(inputPath, 'utf-8');
      const $ = load(content);
      const title = $('title').text();
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
    return /* html */`<svg ${attributes}><use href="#${name}-icon"></use></svg>`;
  });
};

