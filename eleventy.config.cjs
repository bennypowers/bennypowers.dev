require('dotenv').config();

const { EleventyRenderPlugin } = require('@11ty/eleventy');

const DecksPlugin = require('eleventy-plugin-slide-decks');
const EmbedPlugin = require('eleventy-plugin-embed-everything');
const TableOfContentsPlugin = require('eleventy-plugin-nesting-toc');
const TimeToReadPlugin = require('eleventy-plugin-time-to-read');
const EleventyPluginDirectoryOutput = require('@11ty/eleventy-plugin-directory-output');
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const EleventyPluginRSS = require('@11ty/eleventy-plugin-rss');
const EleventyPluginWebC = require('@11ty/eleventy-plugin-webc');

const YAMLDataPlugin = require('./_plugins/yaml-data.cjs');
const MarkdownTweaksPlugin = require('./_plugins/markdown/tweaks.cjs');
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
const DC23Plugin = require('./_plugins/devconf-brno-2023.cjs');
const JamPackPlugin = require('./_plugins/jampack.cjs');
const WebmentionsPlugin = require('./_plugins/webmentions/webmentions.cjs');
const ImportMapPlugin = require('./_plugins/importMap.cjs');
const WebCDSDWorkaroundPlugin = require('./_plugins/dsd/webc-dsd-slot-workaround.cjs');
const FedEmbedPlugin = require('./_plugins/fed-embed/fed-embed.cjs');

const isWatch =
  process.argv.some(x => x === '--serve' || x === '--watch');

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', x => YAML.parse(x));
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addPassthroughCopy('manifest.webmanifest');
  eleventyConfig.addPassthroughCopy('assets/**/*.{svg,png,jpeg,jpg,gif,webp,webm,js,d.ts,ico,webmanifest,json}');
  eleventyConfig.addPassthroughCopy('decks/**/*.gif');
  eleventyConfig.addPassthroughCopy('decks/pf-collab/demo/react-dist/fonts');
  eleventyConfig.addGlobalData('isProductionBuild', process.env.NETLIFY && process.env.CONTEXT === 'production');
  eleventyConfig.addWatchTarget('decks/*/components/*.css');
  eleventyConfig.addWatchTarget('decks/*/index.webc');
  eleventyConfig.watchIgnores.add('assets/images/*');
  eleventyConfig.watchIgnores.add('decks/starting-functional-javascript/images/*');

  eleventyConfig.addGlobalData('isWatch', isWatch);

  !isWatch &&
  eleventyConfig.addPlugin(EleventyPluginDirectoryOutput);

  eleventyConfig.addPlugin(YAMLDataPlugin);
  eleventyConfig.addPlugin(MarkdownTweaksPlugin);
  eleventyConfig.addPlugin(FedEmbedPlugin);
  eleventyConfig.addPlugin(WebCDSDWorkaroundPlugin);
  eleventyConfig.addPlugin(OpenGraphCardPlugin);
  eleventyConfig.addPlugin(FiltersPlugin);
  eleventyConfig.addPlugin(FontsPlugin);
  eleventyConfig.addPlugin(GlitchPlugin);
  eleventyConfig.addPlugin(IconsPlugin);
  eleventyConfig.addPlugin(PostsPlugin);
  eleventyConfig.addPlugin(RHDSPlugin);
  eleventyConfig.addPlugin(DC23Plugin);
  eleventyConfig.addPlugin(RedHatDeckPlugin);
  eleventyConfig.addPlugin(TableOfContentsPlugin);
  eleventyConfig.addPlugin(TimeToReadPlugin);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(EleventyPluginRSS);

  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(EmojiWrapPlugin, { exclude: /^_site\/.*-repro\.html$/ });
  eleventyConfig.addPlugin(JamPackPlugin, { exclude: 'decks/pf-collab/**/*', });
  eleventyConfig.addPlugin(DecksPlugin, { assetsExtensions: ['jpg', 'png', 'webp', 'svg', 'js']});
  eleventyConfig.addPlugin(PostCSSPlugin, { include: /devconf-brno-2023\/components\/.*\.css/ });

  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight, {
    init() {
      require('prismjs/components/index')(['html']);
      require('prismjs/components/index')(['regex']);
      require('prismjs/components/index')(['js-templates']);
      require('prismjs/components/index')(['javascript']);
    },
  });

  eleventyConfig.addPlugin(EleventyPluginWebC, {
    components: [
      '_components/**/*.webc',
      '_plugins/*/components/*.webc',
      'decks/**/components/**/*.webc',
      'npm:@11ty/eleventy-plugin-syntaxhighlight/*.webc',
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
      '@patternfly/elements/pf-button/pf-button.js',
      '@patternfly/elements/pf-card/pf-card.js',
      '@patternfly/elements/pf-icon/pf-icon.js',
      '@patternfly/elements/pf-modal/pf-modal.js',
      '@patternfly/elements/pf-spinner/pf-spinner.js',
      '@patternfly/elements/pf-spinner/BaseSpinner.js',
      '@patternfly/elements/pf-accordion/pf-accordion.js',
      '@patternfly/elements/pf-tooltip/pf-tooltip.js',
      '@patternfly/elements/pf-tooltip/BaseTooltip.js',
      '@patternfly/pfe-core/controllers/logger.js',
      '@patternfly/pfe-core/controllers/style-controller.js',
      '@rhds/tokens/media.js',
      'lit@^2',
      'lit@^2/async-directive.js',
      'lit@^2/decorators.js',
      'lit@^2/decorators/custom-element.js',
      'lit@^2/decorators/property.js',
      'lit@^2/decorators/query.js',
      'lit@^2/decorators/query-all.js',
      'lit@^2/decorators/state.js',
      'lit@^2/directive-helpers.js',
      'lit@^2/directive.js',
      'lit@^2/directives/class-map.js',
      'lit@^2/directives/if-defined.js',
      'lit@^2/experimental-hydrate-support.js',
      'lit@^2/experimental-hydrate.js',
      'lit@^2/static-html.js',
    ],
    additionalImports(configData) {
      const pathPrefix = configData?.pathPrefix ?? process.env.ELEVENTY_PATH_PREFIX ?? '';
      const rhdsPrefix = `/${pathPrefix}/assets/@rhds/elements`.replace(/\/+/, '/');
      return {
        slidem: `/assets/decks.min.js`,
        'slidem/slidem-slide.js': `/assets/decks.min.js`,
        ['@rhds/elements']: `${rhdsPrefix}/rhds.min.js`,
        ['@rhds/elements/']: `${rhdsPrefix}/elements/`,
        ['@rhds/elements/lib/']: `${rhdsPrefix}/lib/`,
      };
    }
  });

  return {
    templateFormats: [ 'md', 'njk', 'html', 'svg', 'css' ],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
