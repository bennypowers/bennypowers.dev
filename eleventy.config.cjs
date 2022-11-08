const YAML = require('yaml');
const esbuildPlugin = require('./_plugins/esbuild.cjs');
const glitchPlugin = require('./_plugins/glitch.cjs');
const embedPlugin = require('eleventy-plugin-embed-everything');
const helmetPlugin = require('eleventy-plugin-helmet');
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 * @return{import('@11ty/eleventy/src/UserConfig.js')}
 */
module.exports = function(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
  eleventyConfig.addExtension('svg', {
    compile(inputContent) {
      return () => inputContent;
    }
  });
  eleventyConfig.ignores.add('README.md');
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPlugin(esbuildPlugin, [ 'github-repository', 'dev-feed' ]);
  eleventyConfig.addPlugin(glitchPlugin);
  eleventyConfig.addPlugin(helmetPlugin);
  eleventyConfig.addPlugin(embedPlugin, { lite: true });
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);

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
