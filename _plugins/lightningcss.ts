import type { UserConfig } from '@11ty/eleventy';

import { transform, browserslistToTargets, Features } from 'lightningcss';
import browserslist from 'browserslist';

// Target modern browsers to avoid transpiling light-dark()
// See: https://github.com/parcel-bundler/lightningcss/issues/821
const targets = browserslistToTargets(browserslist([
  'last 2 Chrome versions',
  'last 2 Firefox versions',
  'last 2 Safari versions',
  'last 2 Edge versions',
]));

export async function css(
  input: string | Promise<string>,
  from: string = this?.page?.inputPath ?? 'input.css',
): Promise<string> {
  try {
    const code = await input;

    // Skip non-string, empty, or whitespace-only CSS
    if (typeof code !== 'string' || !code.trim()) {
      return typeof code === 'string' ? code : '';
    }

    const result = transform({
      filename: from,
      code: Buffer.from(code),
      minify: true,
      targets,
      // Enable custom media queries
      drafts: {
        customMedia: true,
      },
      // Enable nesting parsing and disable light-dark() transpilation
      include: Features.Nesting,
      exclude: Features.LightDark,
    });
    return result.code.toString();
  } catch (e) {
    // Fallback to original CSS if LightningCSS can't process it
    // (e.g., advanced nesting syntax that browsers support natively)
    console.error('[lightningcss] Transform error:', (e as Error).message);
    return typeof input === 'string' ? input : await input;
  }
}

export function LightningCSSPlugin(eleventyConfig: UserConfig) {
  // Note: DO NOT register a 'css' filter - it conflicts with WebC's internal CSS bundling
  // The css function is used in the bundle transform, not as a filter
}
