require('dotenv').config();
const YAML = require('yaml');

const attrs = require('markdown-it-attrs');
const anchor = require('markdown-it-anchor');
const deflist = require('markdown-it-deflist');

const { EleventyRenderPlugin } = require('@11ty/eleventy');

const DecksPlugin = require('eleventy-plugin-slide-decks');
const EmbedPlugin = require('eleventy-plugin-embed-everything');
const TableOfContentsPlugin = require('eleventy-plugin-nesting-toc');
const TimeToReadPlugin = require('eleventy-plugin-time-to-read');
const EleventyPluginDirectoryOutput = require('@11ty/eleventy-plugin-directory-output');
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const EleventyPluginRSS = require('@11ty/eleventy-plugin-rss');

const GlitchPlugin = require('./_plugins/glitch.cjs');
const IconsPlugin = require('./_plugins/icons.cjs');
const FiltersPlugin = require('./_plugins/filters.cjs');
const FontsPlugin = require('./_plugins/fonts.cjs');
const PostsPlugin = require('./_plugins/posts.cjs');
const PostCSSPlugin = require('./_plugins/postcss.cjs');
const RedHatDeckPlugin = require('./_plugins/redhat-deck.cjs');
const RHDSPlugin = require('./_plugins/rhds.cjs');
const JamPackPlugin = require('./_plugins/jampack.cjs');
const WebmentionsPlugin = require('./_plugins/webmentions.cjs');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.ignores.add('README.md');
  eleventyConfig.setQuietMode(true);
  eleventyConfig.amendLibrary('md', /**@param{import('markdown-it')}md*/md =>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(attrs, { allowedAttributes: [ 'id', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] }));
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
  eleventyConfig.addPassthroughCopy('assets/**/*.{svg,png,jpe?g,gif,webp,webm,js,d.ts,ico,webmanifest,json}');
  eleventyConfig.addPlugin(PostsPlugin);
  eleventyConfig.addPlugin(IconsPlugin);
  eleventyConfig.addPlugin(FiltersPlugin);
  eleventyConfig.addPlugin(FontsPlugin);
  eleventyConfig.addPlugin(DecksPlugin, { assetsExtensions: ['jpg', 'png', 'webp', 'svg', 'js']});
  eleventyConfig.addPlugin(RedHatDeckPlugin);
  eleventyConfig.addPlugin(RHDSPlugin);
  eleventyConfig.addPlugin(GlitchPlugin);
  eleventyConfig.addPlugin(PostCSSPlugin, { exclude: /_plugins/ });
  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(TableOfContentsPlugin);
  eleventyConfig.addPlugin(TimeToReadPlugin);
  eleventyConfig.addPlugin(EleventyPluginDirectoryOutput);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(EleventyPluginRSS);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight, { init() { require('prismjs/components/index')(['regex']) } });
  eleventyConfig.addPlugin(JamPackPlugin);
  eleventyConfig.addPlugin(WebmentionsPlugin, {
    domain: 'https://bennypowers.dev',
    webmentionIoToken: process.env.WEBMENTION_IO_TOKEN,
    devToToken: process.env.DEV_TO_TOKEN,
  });
  return {
    templateFormats: [ 'md', 'njk', 'html', 'svg', 'css' ],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
