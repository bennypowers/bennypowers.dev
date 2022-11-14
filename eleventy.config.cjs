const YAML = require('yaml');
const anchor = require('markdown-it-anchor');
const EsbuildPlugin = require('./_plugins/esbuild.cjs');
const GlitchPlugin = require('./_plugins/glitch.cjs');
const EmbedPlugin = require('eleventy-plugin-embed-everything');
const TableOfContentsPlugin = require('eleventy-plugin-nesting-toc');
const TimeToReadPlugin = require('eleventy-plugin-time-to-read');
const EleventyPluginDirectoryOutput = require('@11ty/eleventy-plugin-directory-output');
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const { EleventyRenderPlugin } = require('@11ty/eleventy');

const isWatching = () =>
  process.argv.includes('--watch') || process.argv.includes('--serve')

/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 * @return{*}
 */
module.exports = function(eleventyConfig) {
  eleventyConfig.ignores.add('README.md');
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
  eleventyConfig.addExtension('svg', { compile: x => () => x });
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addGlobalData('watch', isWatching);
  eleventyConfig.amendLibrary('md', md => md.use(anchor, {
    permalink: anchor.permalink.headerLink(),
  }));
  eleventyConfig.addPlugin(EsbuildPlugin, ['github-repository']);
  eleventyConfig.addPlugin(GlitchPlugin);
  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(TableOfContentsPlugin);
  eleventyConfig.addPlugin(TimeToReadPlugin);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
  eleventyConfig.addPlugin(EleventyPluginDirectoryOutput);
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  eleventyConfig.addFilter('abbrs', function(content) {
    let replaced = content;
    for (const { name, title } of this.ctx.abbrs ?? []) {
      if (name && title)
        replaced = replaced.replaceAll(name, `<abbr title="${title}">${name}</abbr>`)
          // shitty workaround for a shitty problem
         .replaceAll(
          `<a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/<abbr title="Accessible Rich Internet Applications">ARIA</abbr>`,
          `<a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/`);
    }
    return replaced;
  });

  eleventyConfig.addFilter('formatDate', function(d, opts) {
    if (d instanceof Date) {
      return new Intl.DateTimeFormat('en-US', opts).format(d);
    } else {
      try {
        const date = new Date(d);
        return new Intl.DateTimeFormat('en-US', opts).format(date);
      } catch (e) {
        return d
      }
    }
  })

  eleventyConfig.addCollection('posts', (collectionApi) => {
    const g = x => x.data.datePublished;
    return collectionApi
      .getFilteredByGlob('./posts/**/*.md')
      .sort((a, b) =>
          g(a) === g(b) ? 0
        : g(a) > g(b) ? 1
        : -1);
  });

  return {
    templateFormats: [ 'md', 'njk', 'html', 'svg' ],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
