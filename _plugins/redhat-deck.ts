import type { UserConfig } from '@11ty/eleventy';

import { readFile, writeFile, mkdir, glob } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

import { postcss } from './postcss.ts';

const require = createRequire(import.meta.url);

const GLOBAL_CSS_PATH = join(
  require.resolve('@rhds/tokens'),
  '../../css/global.css'
);

const javascript = String.raw;
const html = String.raw;

async function cssModularize(contents: string, filename: string) {
  return /* js */`// ${filename}
const sheet = new CSSStyleSheet();
await sheet.replace(\`${await postcss(contents)}\`);
export default sheet;
`;
}

function htmlModularize(contents: string, filename: string) {
  return /* js*/`// ${filename}
const template = document.createElement('template');
template.innerHTML = \`${contents}\`;
export default template;
`;
}

const cwd = join(dirname(import.meta.url), 'redhat-deck', 'elements').replace('file:', '')
const OUTDIR = join(process.cwd(), '_site', 'assets', 'redhat-deck').replace('file:', '');

async function writeModules(
  transform: (content: string, filename: string) => string | Promise<string>,
  ext: string,
) {
  for await (const fileName of glob(`*.${ext}`, { cwd })) {
    const OUTFILE = join(OUTDIR, 'elements', fileName) + '.js';
    const contents = await readFile(join(cwd, fileName), 'utf8');
    await mkdir(dirname(OUTFILE), { recursive: true });
    await writeFile(OUTFILE, await transform(contents, fileName), 'utf8')
  }
}

async function writeEntryPoint() {
  const FILES = [];
  for await (const file of glob(`*.js`, { cwd })) FILES.push(file);
  const OUTFILE = join(OUTDIR, 'redhat-theme.js');
  const OUTPUT = FILES.map(x => `import './elements/${x}';`).join('\n');
  await mkdir(dirname(OUTFILE), { recursive: true });
  await writeFile(OUTFILE, OUTPUT, 'utf8');
}

function quote(content: string, by: object, { slot = 'aside' } = {}) {
  return html`
<figure slot="${slot}">
${content}${!by ? '' : `

<figcaption>${by}</figcaption>`}
</figure>
`;
}
function inputType(type: HTMLInputElement['type']) {
  let content = html`<input type="${type}">`;
  if (type === 'radio')
    content = html`<span style="display:flex">
<input type="radio" name="group">
<input type="radio" name="group">
<input type="radio" name="group">
</span>
`;
  return html`
<label>

\`\`\`html
<input type="${type}">
\`\`\`

</label>

${content}

`;
}

export function RedHatDeckPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addPassthroughCopy({
    [GLOBAL_CSS_PATH]: 'assets/@rhds',
    '_plugins/redhat-deck/*': 'assets/redhat-deck',
    '_plugins/redhat-deck/elements/*.js': 'assets/redhat-deck/elements'
  });
  eleventyConfig.addWatchTarget('decks/*/slides/*.md');
  eleventyConfig.addPairedShortcode('quote', quote);
  eleventyConfig.addPairedShortcode('inputType', inputType);
  let watchRanOnce = false;

  eleventyConfig.on('eleventy.before', async function({ runMode }) {
    if ((runMode === 'serve' || runMode === 'watch') && watchRanOnce) return;
    await Promise.all([
      writeEntryPoint(),
      writeModules(cssModularize, 'css'),
      writeModules(htmlModularize, 'html'),
    ])
      watchRanOnce = true;
    });
}
