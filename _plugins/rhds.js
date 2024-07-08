// @ts-check
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';

import { EleventyRenderPlugin } from '@11ty/eleventy';

import EleventyNavigationPagination from "@11ty/eleventy-navigation";
import EleventySyntaxHighlightPlugin from "@11ty/eleventy-plugin-syntaxhighlight";

const require = createRequire(import.meta.url);

const html = String.raw;

/**
 * @param {string} from
 * @param {string} to
 */
async function copyRecursive(from, to) {
  await mkdir(to, { recursive: true });
  for (const element of await readdir(from)) {
    const _from = join(from, element);
    const _to = join(to, element);
    const stat = await lstat(_from);
    if (stat.isFile()) {
      await copyFile(_from, _to);
    } else {
      await copyRecursive(_from, _to);
    }
  }
}

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function RHDSPlugin(eleventyConfig) {
  let watchRanOnce = false
  eleventyConfig.on('eleventy.before', async ({ runMode }) => {
    if ((runMode === 'serve' || runMode === 'watch') && watchRanOnce) return;
    console.log('[rhds]: Copying RHDS elements assets...');
    const from = join(require.resolve('@rhds/elements'), '..');
    const to = join(process.cwd(), '_site', 'assets', '@rhds', 'elements');
    await copyRecursive(from, to);
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

  eleventyConfig.addFilter('hasUrl', function(children, url) {
    function isActive(entry) {
      return entry.url === url || (entry.children ?? []).some(x => isActive(x));
    }
    return children.some(x => isActive(x));
  });

  /** Render a Red Hat Alert */
  eleventyConfig.addPairedShortcode('rhalert', function(content, {
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

  /** Render a Red Hat footer, based on global `footer` data key */
  eleventyConfig.addPairedNunjucksAsyncShortcode('rhfooter', async function() {
    const LOGO_URL = 'https://static.redhat.com/libs/redhat/brand-assets/2/corp/logo--on-dark.svg';
    const {
      links = [],
      secondary = [],
      socialLinks = [],
      globalLinks = [],
      globalLinksSecondary = []
    } = this.ctx.footer;
    return html`
<rh-footer>
  <a slot="logo" href="/en">
    <img src="${eleventyConfig.javascriptFunctions.url(LOGO_URL)}" alt="Red Hat Israel logo" loading="lazy">
  </a>${socialLinks.map(link => `
  <rh-footer-social-link slot="social-links" icon="web-icon-${link.icon}">
    <a href="${link.href}">${link.content}</a>
  </rh-footer-social-link>`).join('\n')}${links.map(column => `
  <h3 slot="links">${column.heading}</h3>
  <ul slot="links">${(column.links ?? []).map(link => `
    <li><a href="${link.href}">${link.content}</a></li>`).join('\n')}
  </ul>`).join('\n')}${(await Promise.all(secondary.map(async block => `
  <rh-footer-block slot="main-secondary">
  <h3 slot="header">${block.heading}</h3>

    ${await eleventyConfig.javascriptFunctions.renderTemplate(block.content, 'md')}

  </rh-footer-block>`))).join('\n')}
  <rh-global-footer slot="global" class="
      ${globalLinks.length ? '' : 'no-links'}
      ${globalLinksSecondary.length ? '' : 'no-secondary-links'}">${!globalLinks.length ? '' : `
    <h3 slot="links-primary" hidden>Red Hat legal and privacy links</h3>
    <ul slot="links-primary">${globalLinks.map(link => `
      <li><a href="${link.href}">${link.content}</a></li>`).join('\n')}
    </ul>`}${!globalLinksSecondary.length ? '' : `
    <rh-footer-copyright slot="links-secondary"></rh-footer-copyright>
    <h3 slot="links-secondary" hidden>Red Hat legal and privacy links</h3>
    <ul slot="links-secondary">${globalLinksSecondary.map(link => `
      <li><a href="${link.href}">${link.content}</a></li>`).join('\n')}
    </ul>`}
  </rh-global-footer>
</rh-footer>`;
  });
};

