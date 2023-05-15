require('dotenv').config();
const YAML = require('yaml');

const attrs = require('markdown-it-attrs');
const anchor = require('markdown-it-anchor');
const deflist = require('markdown-it-deflist');
const footnote = require('markdown-it-footnote');

const { EleventyRenderPlugin } = require('@11ty/eleventy');

const DecksPlugin = require('eleventy-plugin-slide-decks');
const EmbedPlugin = require('eleventy-plugin-embed-everything');
const TableOfContentsPlugin = require('eleventy-plugin-nesting-toc');
const TimeToReadPlugin = require('eleventy-plugin-time-to-read');
const EleventyPluginDirectoryOutput = require('@11ty/eleventy-plugin-directory-output');
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const EleventyPluginRSS = require('@11ty/eleventy-plugin-rss');
const EleventyPluginWebC = require('@11ty/eleventy-plugin-webc');

const EmojiWrapPlugin = require('./_plugins/emoji-wrap.cjs');
const GlitchPlugin = require('./_plugins/glitch.cjs');
const IconsPlugin = require('./_plugins/icons.cjs');
const FiltersPlugin = require('./_plugins/filters.cjs');
const FontsPlugin = require('./_plugins/fonts.cjs');
const OpenGraphCardPlugin = require('./_plugins/opengraph-cards.cjs');
const PostsPlugin = require('./_plugins/posts.cjs');
const PostCSSPlugin = require('./_plugins/postcss.cjs');
const RedHatDeckPlugin = require('./_plugins/redhat-deck.cjs');
const RHDSPlugin = require('./_plugins/rhds.cjs');
const JamPackPlugin = require('./_plugins/jampack.cjs');
const WebmentionsPlugin = require('./_plugins/webmentions.cjs');
const ImportMapPlugin = require('./_plugins/importMap.cjs');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.ignores.add('README.md');
  eleventyConfig.setQuietMode(true);
  eleventyConfig.amendLibrary('md', /**@param{import('markdown-it')}md*/md =>
    md.set({ breaks: false })
      .use(anchor, { permalink: anchor.permalink.headerLink(), })
      .use(deflist)
      .use(footnote)
      .use(attrs, { allowedAttributes: [ 'id', 'slot', 'hidden', 'style',
                                         'reveal', 'current', /^data-.*$/ ] }));
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
  eleventyConfig.addPassthroughCopy('assets/**/*.{svg,png,jpeg,jpg,gif,webp,webm,js,d.ts,ico,webmanifest,json}');
  eleventyConfig.addGlobalData('isProductionBuild', process.env.NETLIFY && process.env.CONTEXT === 'production');
  eleventyConfig.addPlugin(DecksPlugin, { assetsExtensions: ['jpg', 'png', 'webp', 'svg', 'js']});
  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(EmojiWrapPlugin, { exclude: /^_site\/.*-repro\.html$/ });
  eleventyConfig.addPlugin(FiltersPlugin);
  eleventyConfig.addPlugin(FontsPlugin);
  eleventyConfig.addPlugin(GlitchPlugin);
  eleventyConfig.addPlugin(IconsPlugin);
  eleventyConfig.addPlugin(JamPackPlugin);
  eleventyConfig.addPlugin(OpenGraphCardPlugin);
  eleventyConfig.addPlugin(PostCSSPlugin);
  eleventyConfig.addPlugin(PostsPlugin);
  eleventyConfig.addPlugin(RHDSPlugin);
  eleventyConfig.addPlugin(RedHatDeckPlugin);
  eleventyConfig.addPlugin(TableOfContentsPlugin);
  eleventyConfig.addPlugin(TimeToReadPlugin);
  eleventyConfig.addPlugin(EleventyPluginDirectoryOutput);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(EleventyPluginRSS);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight, { init() { require('prismjs/components/index')(['regex']) } });
  eleventyConfig.addPlugin(EleventyPluginWebC, {
    components: [
      '_components/**/*.webc',
      'decks/**/components/**/*.webc',
    ],
    bundlePluginOptions: {
      transforms: [
        async function(content) {
          if (this.type === 'css') {
            return PostCSSPlugin.postcss(content);
          } else {
            return content;
          }
        }
      ]
    }
  });
  eleventyConfig.addPlugin(WebmentionsPlugin, {
    domain: 'bennypowers.dev',
    webmentionIoToken: process.env.WEBMENTION_IO_TOKEN,
    devToToken: process.env.DEV_TO_TOKEN,
  });
  eleventyConfig.addPlugin(ImportMapPlugin, {
    specs: [
      'tslib',
      '@patternfly/elements/pf-card/pf-card.js',
      '@patternfly/elements/pf-icon/pf-icon.js',
      '@patternfly/elements/pf-modal/pf-modal.js',
      '@patternfly/elements/pf-spinner/pf-spinner.js',
      '@patternfly/elements/pf-spinner/BaseSpinner.js',
      '@patternfly/elements/pf-accordion/pf-accordion.js',
      '@patternfly/elements/pf-tooltip/pf-tooltip.js',
      '@patternfly/elements/pf-tooltip/BaseTooltip.js',
      'lit',
      'lit/async-directive.js',
      'lit/decorators.js',
      'lit/directive-helpers.js',
      'lit/directive.js',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      'lit/experimental-hydrate-support.js',
      'lit/experimental-hydrate.js',
      'lit/static-html.js',
    ],
    additionalImports(configData) {
      const pathPrefix = configData?.pathPrefix ?? process.env.ELEVENTY_PATH_PREFIX ?? '';
      const rhdsPrefix = `/${pathPrefix}/assets/@rhds/elements`.replaceAll('//', '/');
      return {
        slidem: `/assets/decks.min.js`,
        'slidem/slidem-slide.js': `/assets/decks.min.js`,
        ['@rhds/elements']: `${rhdsPrefix}/rhds.min.js`,
        ['@rhds/elements/']: `/${rhdsPrefix}/elements/`,
      };
    }
  });

  eleventyConfig.addPairedShortcode('dc23Feature', function(content, lang="html") {
    return `<div slot="feature">

\`\`\`${lang}
${content}
\`\`\`

</div>
${content}

`;
  })

  return {
    templateFormats: [ 'md', 'njk', 'html', 'svg', 'css' ],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
