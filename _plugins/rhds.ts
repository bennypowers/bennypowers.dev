import { join } from 'node:path';
import { cp } from 'node:fs/promises';

import { EleventyRenderPlugin, type UserConfig } from '@11ty/eleventy';

import EleventyNavigationPagination from '@11ty/eleventy-navigation';
import EleventySyntaxHighlightPlugin from '@11ty/eleventy-plugin-syntaxhighlight';

const html = String.raw;

export function RHDSPlugin(eleventyConfig: UserConfig) {
  let watchRanOnce = false
  eleventyConfig.on('eleventy.before', async ({ runMode }) => {
    if ((runMode === 'serve' || runMode === 'watch') && watchRanOnce) return;
    console.log('[rhds]: Copying RHDS elements assets...');
    for (const pkg of ['icons', 'elements']) {
      const from = join(import.meta.resolve(`@rhds/${pkg}`), '..').replace('file:', '');
      const to = join(process.cwd(), '_site', 'assets', '@rhds', pkg);
      await cp(from, to, { recursive: true })
    }
    console.log('[rhds]:   ...done');
    watchRanOnce = true;
  });

  /** Load upstream plugins only if they aren't already loaded */
  for (const upstreamPlugin of [
    EleventySyntaxHighlightPlugin,
    EleventyNavigationPagination,
    EleventyRenderPlugin,
  ]) {
    if (eleventyConfig.plugins.every(({ plugin }) => plugin !== upstreamPlugin)) {
      eleventyConfig.addPlugin(upstreamPlugin);
    }
  }

  eleventyConfig.addFilter('hasUrl', function(children: any[], url: string) {
    function isActive(entry: { url: string; children: any; }) {
      return entry.url === url || (entry.children ?? []).some(x => isActive(x));
    }
    return children.some(x => isActive(x));
  });

  /** Render a Red Hat Alert */
  eleventyConfig.addPairedShortcode('rhalert', function(content: string, {
    state = 'info',
    title = 'Note:',
  } = {}) {
    return html`

<rh-alert state="${state}">
  <h3 slot="header">${title}</h3>

${content}


</rh-alert>

`;
  });
};

