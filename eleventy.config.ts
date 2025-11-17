import type { UserConfig } from '@11ty/eleventy';

try { process.loadEnvFile(); } catch {}

import { EleventyRenderPlugin } from '@11ty/eleventy';

import EleventyPluginDirectoryOutput from '@11ty/eleventy-plugin-directory-output';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import EleventyPluginWebC from '@11ty/eleventy-plugin-webc';
import EleventyRSSPlugin from '@11ty/eleventy-plugin-rss';

import EmbedPlugin from 'eleventy-plugin-embed-everything';
import HelmetPlugin from 'eleventy-plugin-helmet';
import TableOfContentsPlugin from 'eleventy-plugin-nesting-toc';
import TimeToReadPlugin from 'eleventy-plugin-time-to-read';

import { slideDecksPlugin as DecksPlugin } from 'eleventy-plugin-slide-decks';

import { WebmentionsPlugin } from '#plugins/webmentions/webmentions.ts';
import { ImportMapPlugin } from '#plugins/importMap.ts';

import { YAMLDataPlugin } from '#plugins/yaml-data.ts';
import { MarkdownTweaksPlugin } from '#plugins/markdown/tweaks.ts';
import { EmojiWrapPlugin } from '#plugins/emoji-wrap.ts';
import { GlitchPlugin } from '#plugins/glitch.ts';
import { IconsPlugin } from '#plugins/icons.ts';
import { FiltersPlugin } from '#plugins/filters.ts';
import { FontsPlugin } from '#plugins/fonts.ts';
import { OpenGraphCardPlugin } from '#plugins/opengraph-cards.ts';
import { PostsPlugin } from '#plugins/posts.ts';
import { PostCSSPlugin, postcss } from '#plugins/postcss.ts';
import { RedHatDeckPlugin } from '#plugins/redhat-deck.ts';
import { RHDSPlugin } from '#plugins/rhds.ts';
import { DC23Plugin } from '#plugins/devconf-brno-2023.ts';
import { DC25Plugin } from '#plugins/devconf-brno-2025.ts';
import { JamPackPlugin } from '#plugins/jampack.ts';
import { WebCDSDWorkaroundPlugin } from '#plugins/dsd/webc-dsd-slot-workaround.ts';
import { FedEmbedPlugin } from '#plugins/fed-embed/fed-embed.ts';
import { RSSSummaryPlugin } from '#plugins/rss-summary.ts';
import { DTLSPlugin } from '#plugins/dtls.ts';

import Prism from 'prismjs/components/index.js';

import isWatch from '#data/watch.ts';

export default function(eleventyConfig: UserConfig) {
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addPassthroughCopy('manifest.webmanifest');
  eleventyConfig.addPassthroughCopy('assets/**/*.{svg,png,jpeg,jpg,gif,webp,webm,mp4,js,d.ts,ico,webmanifest,json,woff,woff2}');
  eleventyConfig.addPassthroughCopy({ 'icons': 'assets/icons' });
  eleventyConfig.addPassthroughCopy('decks/**/*.{gif,png,jpeg,jpg,svg}');
  eleventyConfig.addPassthroughCopy('decks/pf-collab/demo/react-dist/fonts');
  eleventyConfig.addGlobalData('isProductionBuild', process.env.NETLIFY && process.env.CONTEXT === 'production');
  eleventyConfig.addWatchTarget('decks/**/*.css');
  eleventyConfig.addWatchTarget('decks/*/*.md');
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
        async function(content: string) {
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
  eleventyConfig.addPlugin(DTLSPlugin);
  eleventyConfig.addPlugin(WebCDSDWorkaroundPlugin);
  eleventyConfig.addPlugin(OpenGraphCardPlugin);
  eleventyConfig.addPlugin(FiltersPlugin);
  eleventyConfig.addPlugin(FontsPlugin);
  eleventyConfig.addPlugin(GlitchPlugin);
  eleventyConfig.addPlugin(IconsPlugin);
  eleventyConfig.addPlugin(PostsPlugin);
  eleventyConfig.addPlugin(RHDSPlugin);
  eleventyConfig.addPlugin(DC23Plugin);
  eleventyConfig.addPlugin(DC25Plugin);
  eleventyConfig.addPlugin(RedHatDeckPlugin);
  eleventyConfig.addPlugin(TableOfContentsPlugin);
  eleventyConfig.addPlugin(TimeToReadPlugin);
  eleventyConfig.addPlugin(EmbedPlugin, { lite: true });
  eleventyConfig.addPlugin(EmojiWrapPlugin, { exclude: /^_site\/.*-repro\.html$/ });
  eleventyConfig.addPlugin(JamPackPlugin, { exclude: 'decks/**/*' });
  eleventyConfig.addPlugin(PostCSSPlugin, { include: /devconf-brno-2023\/components\/.*\.css/ });

  eleventyConfig.addPlugin(EleventyRSSPlugin);
  eleventyConfig.addPlugin(RSSSummaryPlugin);

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

  eleventyConfig.addPlugin(HelmetPlugin);

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
      '@patternfly/pfe-core',
      '@patternfly/pfe-core/controllers/logger.js',
      '@patternfly/pfe-core/controllers/style-controller.js',
      '@patternfly/pfe-core/controllers/slot-controller.js',
      '@patternfly/pfe-core/controllers/internals-controller.js',
      '@patternfly/pfe-core/controllers/at-focus-controller.js',
      '@patternfly/pfe-core/controllers/roving-tabindex-controller.js',
      '@patternfly/pfe-core/controllers/floating-dom-controller.js',
      '@patternfly/pfe-core/controllers/overflow-controller.js',
      '@patternfly/pfe-core/controllers/timestamp-controller.js',
      '@patternfly/pfe-core/controllers/tabs-aria-controller.js',
      '@patternfly/pfe-core/decorators.js',
      '@patternfly/pfe-core/decorators/observes.js',
      '@patternfly/pfe-core/functions/random.js',
      '@patternfly/pfe-core/functions/context.js',
      '@rhds/tokens/media.js',
      'lit',
      'lit/async-directive.js',
      'lit/decorators.js',
      'lit/decorators/custom-element.js',
      'lit/decorators/query-assigned-elements.js',
      'lit/decorators/property.js',
      'lit/decorators/query.js',
      'lit/decorators/query-all.js',
      'lit/decorators/state.js',
      'lit/directive-helpers.js',
      'lit/directive.js',
      'lit/directives/repeat.js',
      'lit/directives/unsafe-html.js',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      'lit/directives/style-map.js',
      'lit/static-html.js',
      '@lit/context',
    ],
    additionalImports(configData) {
      const pathPrefix = configData?.pathPrefix ?? process.env.ELEVENTY_PATH_PREFIX ?? '';
      const rhdsPrefix = `/${pathPrefix}/assets/@rhds/elements`.replace(/\/+/, '/');
      return {
        slidem: `/assets/decks.min.js`,
        'slidem/slidem-slide.js': `/assets/decks.min.js`,
        ['@rhds/icons/']: `/assets/@rhds/icons/`,
        ['@rhds/elements']: `${rhdsPrefix}/elements.js`,
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
