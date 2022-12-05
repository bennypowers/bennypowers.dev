const { mkdirSync } = require('node:fs');
const { readFile, writeFile, mkdir } = require('node:fs/promises');
const { join, dirname } = require('node:path');
const glob = require('node:util').promisify(require('glob'));

const GLOBAL_CSS_PATH = join(
  require.resolve('@rhds/tokens'),
  '../../css/global.css'
);

function cssModularize(contents) {
  return `
const sheet = new CSSStyleSheet();
await sheet.replace(\`${contents}\`);
export default sheet;
`;
}

function htmlModularize(contents) {
  return `
const template = document.createElement('template');
template.innerHTML = \`${contents}\`;
export default template;
`;
}

function writeModules(transform, ext) {
  return async function() {
    const cwd = join(__dirname, 'redhat-deck', 'elements')
    const OUTDIR = join(process.cwd(), '_site', 'assets', 'redhat-deck', 'elements');
    const FILES = await glob(`*.${ext}`, { cwd });
    for (const fileName of FILES) {
      const OUTFILE = join(OUTDIR, fileName) + '.js';
      const contents = await readFile(join(cwd, fileName), 'utf8');
      await mkdir(dirname(OUTFILE), { recursive: true });
      await writeFile(OUTFILE, transform(contents), 'utf8')
    }
  }
}

async function writeEntryPoint() {
  const cwd = join(__dirname, 'redhat-deck', 'elements')
  const OUTDIR = join(process.cwd(), '_site', 'assets', 'redhat-deck');
  const FILES = await glob(`*.js`, { cwd });
  const OUTFILE = join(OUTDIR, 'redhat-theme.js');
  await mkdir(dirname(OUTFILE), { recursive: true });
  await writeFile(OUTFILE, FILES.map(x => `import './elements/${x}';`).join('\n'), 'utf8')
}

/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 * @param{*} options
 */
module.exports = function(eleventyConfig, options) {
  mkdirSync(join(process.cwd(), '_site', 'decks', 'redhat-beyond-web'), { recursive: true });
  eleventyConfig.addPassthroughCopy({
    [GLOBAL_CSS_PATH]: 'decks/redhat-beyond-web',
    '_plugins/redhat-deck/*': 'assets/redhat-deck',
    '_plugins/redhat-deck/elements/*.js': 'assets/redhat-deck/elements'
  });
  eleventyConfig.addPassthroughCopy('decks/redhat-beyond-web/elements/*.js');
  eleventyConfig.addPairedShortcode('quote', function (content, by, { slot = 'aside' } = {}) {
    return `
<figure slot="${slot}">
${content}

<figcaption>${by}</figcaption>
</figure>
`;
  });
  eleventyConfig.on('eleventy.before', writeEntryPoint);
  eleventyConfig.on('eleventy.before', writeModules(cssModularize, 'css'))
  eleventyConfig.on('eleventy.before', writeModules(htmlModularize, 'html'))
}
