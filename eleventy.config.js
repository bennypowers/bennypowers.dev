/** @import { UserConfig } from '@11ty/eleventy'; */

import 'dotenv/config';

import { EleventyRenderPlugin } from '@11ty/eleventy';

import EleventyPluginDirectoryOutput from '@11ty/eleventy-plugin-directory-output';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import EleventyPluginWebC from '@11ty/eleventy-plugin-webc';

import EmbedPlugin from 'eleventy-plugin-embed-everything';
import TableOfContentsPlugin from 'eleventy-plugin-nesting-toc';
import TimeToReadPlugin from 'eleventy-plugin-time-to-read';

import { feedPlugin as EleventyRSSPlugin } from '@11ty/eleventy-plugin-rss';
import { slideDecksPlugin as DecksPlugin } from 'eleventy-plugin-slide-decks';

import { YAMLDataPlugin } from './_plugins/yaml-data.js';
import { MarkdownTweaksPlugin } from './_plugins/markdown/tweaks.js';
import { EmojiWrapPlugin } from './_plugins/emoji-wrap.js';
import { GlitchPlugin } from './_plugins/glitch.js';
import { IconsPlugin } from './_plugins/icons.js';
import { FiltersPlugin } from './_plugins/filters.js';
import { FontsPlugin } from './_plugins/fonts.js';
import { OpenGraphCardPlugin } from './_plugins/opengraph-cards.js';
import { PostsPlugin } from './_plugins/posts.js';
import { PostCSSPlugin, postcss } from './_plugins/postcss.js';
import { RedHatDeckPlugin } from './_plugins/redhat-deck.js';
import { RHDSPlugin } from './_plugins/rhds.js';
import { DC23Plugin } from './_plugins/devconf-brno-2023.js';
import { JamPackPlugin } from './_plugins/jampack.js';
import { WebmentionsPlugin } from './_plugins/webmentions/webmentions.js';
import { ImportMapPlugin } from './_plugins/importMap.js';
import { WebCDSDWorkaroundPlugin } from './_plugins/dsd/webc-dsd-slot-workaround.js';
import { FedEmbedPlugin } from './_plugins/fed-embed/fed-embed.js';

import Prism from 'prismjs/components/index.js';

const isWatch =
  process.argv.some(x => x === '--serve' || x === '--watch');

/** @param {UserConfig} eleventyConfig */
export default function(eleventyConfig) {
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addPassthroughCopy('manifest.webmanifest');
  eleventyConfig.addPassthroughCopy('assets/**/*.{svg,png,jpeg,jpg,gif,webp,webm,js,d.ts,ico,webmanifest,json,woff,woff2}');
  eleventyConfig.addPassthroughCopy('decks/**/*.{gif,png,jpeg,jpg,svg}');
  eleventyConfig.addPassthroughCopy('decks/pf-collab/demo/react-dist/fonts');
  eleventyConfig.addGlobalData('isProductionBuild', process.env.NETLIFY && process.env.CONTEXT === 'production');
  eleventyConfig.addWatchTarget('decks/**/*.css');
  eleventyConfig.addWatchTarget('decks/*/index.webc');
  eleventyConfig.watchIgnores.add('assets/images/*');
  eleventyConfig.watchIgnores.add('decks/starting-functional-javascript/images/*');

  eleventyConfig.addGlobalData('isWatch', isWatch);

  !isWatch &&
  eleventyConfig.addPlugin(EleventyPluginDirectoryOutput);
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  eleventyConfig.addPlugin(DecksPlugin, { assetsExtensions: ['jpg', 'png', 'webp', 'svg', 'js']});

  eleventyConfig.addPlugin(EleventyPluginWebC, {
    components: [
      '_components/**/*.webc',
      '_plugins/*/components/*.webc',
      'decks/**/components/**/*.webc',
      'npm:@11ty/eleventy-plugin-syntaxhighlight/*.webc',
    ],
    bundlePluginOptions: {
      bundles: ['svg'],
      transforms: [
        /** @param {string} content */
        async function(content) {
          if (this.type === 'css') {
            return postcss(content);
          } else {
            return content;
          }
        }
      ]
    }
  });

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
  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(EmojiWrapPlugin, { exclude: /^_site\/.*-repro\.html$/ });
  eleventyConfig.addPlugin(JamPackPlugin, { exclude: 'decks/pf-collab/**/*', });
  eleventyConfig.addPlugin(PostCSSPlugin, { include: /devconf-brno-2023\/components\/.*\.css/ });

  eleventyConfig.addPlugin(EleventyRSSPlugin, {
    type: 'rss',
    outputPath: '/feed.xml',
    collection: {
      name: 'posts',
      limit: 0,
    },
    metadata: {
      title: "Benny Powers: Web Developer",
      subtitle: 'Thoughts and impression about web development by Benny Powers from Jerusalem',
      language: 'en',
      url: "https://bennypowers.dev/",
      author:{
        name: 'Benny Powers',
        email: 'web@bennypowers.com',
      },
    },
  });

  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight, {
    init() {
      Prism(['html']);
      Prism(['regex']);
      Prism(['js-templates']);
      Prism(['javascript']);
    },
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
      '@patternfly/elements/pf-accordion/pf-accordion.js',
      '@patternfly/elements/pf-tooltip/pf-tooltip.js',
      '@patternfly/pfe-core/controllers/logger.js',
      '@patternfly/pfe-core/controllers/style-controller.js',
      '@patternfly/pfe-core/controllers/slot-controller.js',
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
      'lit@^2/directives/style-map.js',
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
