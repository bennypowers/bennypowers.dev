import type { UserConfig } from '@11ty/eleventy';

import { parseHTML } from 'linkedom';
import { glob, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const globPath = fileURLToPath(new URL('../decks/gaad-2026/components/*.html', import.meta.url));

const paths =
    await Array.fromAsync(glob(globPath))

const templates = await Promise.all(paths.map(async path => ({
  path,
  content: await readFile(path, 'utf8'),
  name: path.split('/').pop().replace('.html', '')
})))

export function GAAD26Plugin(eleventyConfig: UserConfig) {
  eleventyConfig.addPassthroughCopy('./decks/gaad-2026/components/*');
  eleventyConfig.addTransform('gaad-2026', function (content: string) {
    if (!this.page.outputPath?.endsWith?.('.html') || !(this.page.inputPath?.match?.('gaad-2026'))) {
      return content;
    } else {
      const { document } = parseHTML(content);
      const headings = Array.from({length:6}, (_, i) => `h${i+1}`).join(',');
        document
        .querySelectorAll(`:is(${headings}) > a`)
        .forEach(link => {
          const h = link.closest(headings);
          h.innerHTML = link.innerHTML.replace(/#+\s+/, '');
        })
      templates.forEach(({ content, name }) =>
        document.querySelectorAll(name)
          .forEach(el => el.innerHTML = `${content}${el.innerHTML}`));
      return document.toString();
    }
  });
}
