const { readFile, writeFile, mkdir } = require('node:fs/promises');
const { join, dirname } = require('node:path');
const { postcss } = require('./postcss.cjs');

const glob = require('node:util').promisify(require('glob'));

const GLOBAL_CSS_PATH = join(
  require.resolve('@rhds/tokens'),
  '../../css/global.css'
);

async function cssModularize(contents, filename) {
  return `// ${filename}
const sheet = new CSSStyleSheet();
await sheet.replace(\`${await postcss(contents)}\`);
export default sheet;
`;
}

function htmlModularize(contents, filename) {
  return `// ${filename}
const template = document.createElement('template');
template.innerHTML = \`${contents}\`;
export default template;
`;
}

async function writeModules(transform, ext) {
  const cwd = join(__dirname, 'redhat-deck', 'elements')
  const OUTDIR = join(process.cwd(), '_site', 'assets', 'redhat-deck', 'elements');
  const FILES = await glob(`*.${ext}`, { cwd });
  for (const fileName of FILES) {
    const OUTFILE = join(OUTDIR, fileName) + '.js';
    const contents = await readFile(join(cwd, fileName), 'utf8');
    await mkdir(dirname(OUTFILE), { recursive: true });
    await writeFile(OUTFILE, await transform(contents, fileName), 'utf8')
  }
}

async function writeEntryPoint() {
  const cwd = join(__dirname, 'redhat-deck', 'elements')
  const OUTDIR = join(process.cwd(), '_site', 'assets', 'redhat-deck');
  const FILES = await glob(`*.js`, { cwd });
  const OUTFILE = join(OUTDIR, 'redhat-theme.js');
  const OUTPUT = FILES.map(x => `import './elements/${x}';`).join('\n');
  await mkdir(dirname(OUTFILE), { recursive: true });
  await writeFile(OUTFILE, OUTPUT, 'utf8');
}

function quote(content, by, { slot = 'aside' } = {}) {
  return `
<figure slot="${slot}">
${content}${!by ? '' : `

<figcaption>${by}</figcaption>`}
</figure>
`;
}
function inputType(type) {
  let content = `<input type="${type}">`;
  if (type === 'radio')
    content = `<span style="display:flex">
<input type="radio" name="group">
<input type="radio" name="group">
<input type="radio" name="group">
</span>
`;
  return `
<label>

\`\`\`html
<input type="${type}">
\`\`\`

</label>

${content}

`;
}

/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 * @param{*} options
 */
module.exports = function(eleventyConfig, options) {
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
