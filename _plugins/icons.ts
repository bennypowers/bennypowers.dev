import type { UserConfig } from '@11ty/eleventy';
import type { CollectionApi } from './posts.ts';

import { parse } from 'parse5'
import { isElementNode, query, getTextContent } from '@parse5/tools'
import { readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function IconsPlugin(eleventyConfig: UserConfig, {
  bundleName = 'svg',
  iconsDir = './icons/',
} = {}) {
  eleventyConfig.addGlobalData('iconsPluginBucketName', bundleName);
  eleventyConfig.addExtension('svg', {
    compile(content: string, inputPath: string) {
      if (inputPath.startsWith(iconsDir))
        return () => content
    },
    compileOptions: {
      permalink: false,
    },
    isIncrementalMatch() {
      return this.isFileRelevantToInputPath
    },
    async getData(inputPath: string) {
      if (inputPath.startsWith(iconsDir)) {
        const content = await readFile(inputPath, 'utf-8');
        const document = parse(content);
        const titleNode = query(document, node => isElementNode(node) && node.tagName === 'title')
        let title: string;
        if (titleNode)
          title = getTextContent(titleNode);
        return { title }
      } else {
        return false;
      }
    }
  });

  eleventyConfig.addCollection('icon', function(api: CollectionApi) {
    try {
      const iconsPath = join(process.cwd(), 'icons');
      const files = readdirSync(iconsPath).filter(f => f.endsWith('.svg'));
      
      const icons = files.map(filename => {
        const fileSlug = filename.replace('.svg', '');
        const content = readFileSync(join(iconsPath, filename), 'utf8');
        // Extract inner content from SVG (remove <svg> wrapper)
        const svgContent = content.replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '').trim();
        
        return {
          fileSlug,
          content: svgContent,
          rawInput: content
        };
      });
      
      return icons;
    } catch (error) {
      console.error('Error reading icons:', error);
      return [];
    }
  })

  interface IconKwargs {
    [key: string]: string;
  }

  eleventyConfig.addShortcode('icon', function icon(name: string, kwargs: IconKwargs) {
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

