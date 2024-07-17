import { parse } from 'parse5'
import { isElementNode, query, getTextContent } from '@parse5/tools'
import { readFile } from 'node:fs/promises';

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function IconsPlugin(eleventyConfig, {
  bundleName = 'svg',
  iconsDir = './icons/',
} = {}) {
  eleventyConfig.addGlobalData('iconsPluginBucketName', bundleName);
  eleventyConfig.addExtension('svg', {
    compile(content, inputPath) {
      if (inputPath.startsWith(iconsDir))
        return () => content
    },
    compileOptions: {
      permalink: false,
    },
    isIncrementalMatch() {
      return this.isFileRelevantToInputPath
    },
    async getData(inputPath) {
      if (inputPath.startsWith(iconsDir)) {
        const content = await readFile(inputPath, 'utf-8');
        const document = parse(content);
        const titleNode = query(document, node => isElementNode(node) && node.tagName === 'title')
        let title
        if (titleNode)
          title = getTextContent(titleNode);
        return { title }
      } else {
        return false;
      }
    }
  });

  eleventyConfig.addCollection('icon', function(api) {
    return api.getFilteredByGlob('icons/*.svg')
      .map(x => {
        x.templateContent = x.rawInput
        return x;
      });
  })

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

