import type { UserConfig } from '@11ty/eleventy';
import EleventyFetch from '@11ty/eleventy-fetch';
import markdownIt from 'markdown-it';

const GITHUB_README_URL = 'https://raw.githubusercontent.com/bennypowers/design-tokens-language-server/main/README.md';

/**
 * Plugin to fetch the Design Tokens Language Server README from GitHub
 * and make it available as global data for the /dtls/ page
 */
export function DTLSPlugin(eleventyConfig: UserConfig) {
  // Create markdown renderer
  const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  // Add a global data function to fetch the DTLS README from GitHub
  // Uses eleventy-fetch for caching
  eleventyConfig.addGlobalData('dtlsReadme', async () => {
    try {
      const readme = await EleventyFetch(GITHUB_README_URL, {
        duration: '1d', // Cache for 1 day
        type: 'text',
      });

      // Ensure readme is a string
      let readmeStr = String(readme);

      // Fix relative image paths to point to GitHub
      // Convert ./docs/image.png to https://raw.githubusercontent.com/...
      readmeStr = readmeStr.replace(
        /!\[(.*?)\]\(\.\/docs\/(.*?)\)/g,
        '![$1](https://raw.githubusercontent.com/bennypowers/design-tokens-language-server/main/docs/$2)'
      );

      // Convert markdown to HTML
      const html = md.render(readmeStr);

      return html;
    } catch (error) {
      console.error('[DTLS Plugin] Failed to fetch README from GitHub:', error);
      return '<h1>Design Tokens Language Server</h1><p>README not available. See <a href="https://github.com/bennypowers/design-tokens-language-server">GitHub</a> for details.</p>';
    }
  });
}
