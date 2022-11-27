const path = require('path');
const cheerio = require('cheerio');

const assignDeck = x => Object.assign(x, { deck: x.data.page.filePathStem.split('/').at(2) });

const byInputPath = (a, b) =>
    a.inputPath < b.inputPath ? -1
  : a.inputPath > b.inputPath ? 1
  : 0;

/**
 * @param {string} content HTML content of the page
 * @selector {string} selector CSS selector (all) to apply `reveal` attr to
 *
 */
function addRevealAttrs(content, selector) {
  if (!selector) return content;
  const $ = cheerio.load(content);
  $(selector).each(function() {
    const closest = $(this).closest('[slot="presenter"]');
    if (!closest.length)
      $(this).attr('reveal', '');
  });
  return $.html();
}

/** Bundle Slidem deck dependencies */
async function bundleSlidemDependencies(e) {
  console.log('[decks]: bundling with esbuild');

  const { build } = await import('esbuild');
  const { minifyHTMLLiteralsPlugin } = await import('esbuild-plugin-minify-html-literals')
  await build({
    outfile: '_site/assets/decks.min.js',
    format: 'esm',
    bundle: true,
    minifySyntax: true,
    minifyWhitespace: true,
    mangleQuoted: false,
    legalComments: 'linked',
    plugins: [
      minifyHTMLLiteralsPlugin({
        minifyOptions: {
          removeComments: true,
          minifyCSS: true,
        },
      })
    ],
    stdin: {
      sourcefile: 'components.js',
      resolveDir: path.join(__dirname, '..', 'node_modules'),
      contents: `
import 'slidem';
import 'slidem/slidem-slide.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
`,
    },
  });
  console.log('  ...done');
}

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {object} options Options for the decks
 * Create Slide Decks using eleventy.
 *
 * Create a `decks` dir in your eleventy root to hold your slide decks, one per directory.
 * Each deck dir should contain a template with frontmatter metadata for the deck,
 * and a `slides` dir containing templates for each slide. You must add a `slides` 11ty data file
 * containing `{"permalink":false}`, otherwise your slides will be published individually as well
 * as part of the slide deck.
 * @example
 * ```tree
 * decks
 * └── 11ty-decks
 *     ├── deck-graphic.svg
 *     └── slides
 *         ├── 00-title-card.md
 *         ├── 01-intro.md
 *         ├── 10-code.md
 *         ├── 99-thanks.md
 *         └── slides.json
 * ```
 */
module.exports = function decksPlugin(eleventyConfig, {
  decksDir = 'decks',
  assetsExtensions = [
    'js',
    'css',
    'png',
    'svg',
    'webp',
    'jpg',
    'jpeg',
    'mp4',
  ]
} = {}) {
  for (const ext of assetsExtensions)
    eleventyConfig.addPassthroughCopy(`${decksDir}/**/*.${ext}`);

  /** Get all the slides, sort and assign their deck id */
  eleventyConfig.addCollection('slides', collectionApi => collectionApi
    .getFilteredByGlob(`./${decksDir}/*/slides/*`)
    .map(assignDeck)
    .sort(byInputPath));

  /** Add the `reveal` attribute to all elements matching the selector */
  eleventyConfig.addFilter('reveal', addRevealAttrs);

  /** bundle slidem deck dependencies */
  eleventyConfig.on('eleventy.before', bundleSlidemDependencies);
}
