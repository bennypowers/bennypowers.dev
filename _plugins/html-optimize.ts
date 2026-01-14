import type { UserConfig } from '@11ty/eleventy';

import { minify } from 'html-minifier-terser';
import { parseHTML } from 'linkedom';

interface HTMLOptimizeOptions {
  /** Enable HTML minification (default: true in production) */
  minifyHTML?: boolean;
  /** Enable native lazy loading for images and iframes (default: true) */
  lazyLoading?: boolean;
  /** Enable Speculation Rules for link prefetching (default: true) */
  speculationRules?: boolean;
  /** Glob patterns to exclude from optimization */
  exclude?: string[];
}

const SPECULATION_RULES_SCRIPT = `<script type="speculationrules">
{
  "prefetch": [
    {
      "where": { "and": [
        { "href_matches": "/*" },
        { "not": { "href_matches": "/decks/*" } },
        { "not": { "href_matches": "*.xml" } },
        { "not": { "selector_matches": "[download]" } }
      ]},
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "where": { "and": [
        { "selector_matches": "a[href^='/posts/'], a[href^='/']" },
        { "not": { "href_matches": "/decks/*" } }
      ]},
      "eagerness": "moderate"
    }
  ]
}
</script>`;

/**
 * HTML optimization plugin that replaces jampack's non-image features:
 * - HTML minification via html-minifier-terser
 * - Native lazy loading for images and iframes
 * - Speculation Rules API for link prefetching (replaces quicklink)
 */
export function HTMLOptimizePlugin(
  eleventyConfig: UserConfig,
  options: HTMLOptimizeOptions = {}
) {
  const {
    minifyHTML = process.env.NODE_ENV === 'production' || process.env.CI === 'true',
    lazyLoading = true,
    speculationRules = true,
    exclude = [],
  } = options;

  eleventyConfig.addTransform('html-optimize', async function (content: string) {
    const outputPath = this.page.outputPath;

    // Only process HTML files
    if (!outputPath?.endsWith?.('.html')) {
      return content;
    }

    // Check exclusions
    for (const pattern of exclude) {
      const normalizedPattern = pattern.replace('**/', '').replace('/*', '');
      if (outputPath.includes(normalizedPattern)) {
        return content;
      }
    }

    let result = content;
    const { document } = parseHTML(result);
    let modified = false;

    // Add native lazy loading to images without explicit loading attribute
    if (lazyLoading) {
      document.querySelectorAll('img:not([loading])').forEach((img: Element) => {
        // Don't lazy load images that are likely above the fold
        const isHero = img.closest('header, .hero, [data-hero]');
        const hasHighPriority = img.hasAttribute('fetchpriority');

        if (!isHero && !hasHighPriority) {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
          modified = true;
        }
      });

      // Add lazy loading to iframes without explicit loading attribute
      document.querySelectorAll('iframe:not([loading])').forEach((iframe: Element) => {
        iframe.setAttribute('loading', 'lazy');
        modified = true;
      });
    }

    // Add Speculation Rules for prefetching (Chromium browsers)
    if (speculationRules) {
      const head = document.querySelector('head');
      const existingRules = document.querySelector('script[type="speculationrules"]');

      if (head && !existingRules) {
        head.insertAdjacentHTML('beforeend', SPECULATION_RULES_SCRIPT);
        modified = true;
      }
    }

    if (modified) {
      result = document.toString();
    }

    // Minify HTML
    if (minifyHTML) {
      try {
        result = await minify(result, {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          decodeEntities: true,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
          sortAttributes: true,
          sortClassName: true,
        });
      } catch (e) {
        console.error('[html-optimize] Minification error:', e);
      }
    }

    return result;
  });
}
