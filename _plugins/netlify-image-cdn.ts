import type { UserConfig } from '@11ty/eleventy';
import { parseHTML } from 'linkedom';

interface NetlifyImageCDNOptions {
  /** Image quality (1-100), default 80 */
  quality?: number;
  /** Preferred format, default 'avif' */
  format?: 'avif' | 'webp' | 'auto';
  /** Glob patterns to exclude from transformation */
  exclude?: string[];
  /** Whether to add width parameter from img width attribute */
  useWidth?: boolean;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif)$/i;

/**
 * Transforms local image URLs to use Netlify Image CDN for on-demand optimization.
 * This eliminates build-time image processing.
 * Only runs in build mode, not during dev server.
 *
 * @see https://docs.netlify.com/image-cdn/overview/
 */
export function NetlifyImageCDNPlugin(
  eleventyConfig: UserConfig,
  options: NetlifyImageCDNOptions = {}
) {
  const {
    quality = 80,
    format = 'avif',
    exclude = [],
    useWidth = true,
  } = options;

  let isBuildMode = false;

  eleventyConfig.on('eleventy.before', ({ runMode }) => {
    isBuildMode = runMode === 'build';
  });

  eleventyConfig.addTransform('netlify-image-cdn', function (content: string) {
    // Skip in dev mode - only transform for production builds
    if (!isBuildMode) {
      return content;
    }

    const outputPath = this.page.outputPath;

    // Only process HTML files
    if (!outputPath?.endsWith?.('.html')) {
      return content;
    }

    // Check exclusions
    for (const pattern of exclude) {
      if (outputPath.includes(pattern.replace('**/', '').replace('/*', ''))) {
        return content;
      }
    }

    const { document } = parseHTML(content);
    let modified = false;

    // Transform img elements
    document.querySelectorAll('img[src]').forEach((img: Element) => {
      const src = img.getAttribute('src');
      if (!src) return;

      // Skip external URLs, data URLs, and already-transformed URLs
      if (
        src.startsWith('http') ||
        src.startsWith('data:') ||
        src.startsWith('/.netlify/images')
      ) {
        return;
      }

      // Only transform supported image formats
      if (!IMAGE_EXTENSIONS.test(src)) {
        return;
      }

      // Build Netlify Image CDN URL
      const params = new URLSearchParams();
      params.set('url', src);
      params.set('fm', format);
      params.set('q', quality.toString());

      // Optionally use width from attribute
      if (useWidth) {
        const width = img.getAttribute('width');
        if (width && !isNaN(parseInt(width))) {
          params.set('w', width);
        }
      }

      img.setAttribute('src', `/.netlify/images?${params.toString()}`);
      modified = true;
    });

    // Transform srcset attributes
    document.querySelectorAll('img[srcset], source[srcset]').forEach((el: Element) => {
      const srcset = el.getAttribute('srcset');
      if (!srcset) return;

      const newSrcset = srcset
        .split(',')
        .map((entry) => {
          const [url, descriptor] = entry.trim().split(/\s+/);
          if (
            !url ||
            url.startsWith('http') ||
            url.startsWith('data:') ||
            url.startsWith('/.netlify/images') ||
            !IMAGE_EXTENSIONS.test(url)
          ) {
            return entry;
          }

          const params = new URLSearchParams();
          params.set('url', url);
          params.set('fm', format);
          params.set('q', quality.toString());

          // Extract width from descriptor (e.g., "400w")
          if (descriptor?.endsWith('w')) {
            const width = descriptor.replace('w', '');
            params.set('w', width);
          }

          modified = true;
          return `/.netlify/images?${params.toString()} ${descriptor || ''}`.trim();
        })
        .join(', ');

      el.setAttribute('srcset', newSrcset);
    });

    // Transform CSS background images in style attributes
    document.querySelectorAll('[style*="url("]').forEach((el: Element) => {
      const style = el.getAttribute('style');
      if (!style) return;

      const newStyle = style.replace(
        /url\(['"]?(\/[^'")\s]+\.(jpe?g|png|gif|webp))['"]?\)/gi,
        (match, url) => {
          if (url.startsWith('/.netlify/images')) return match;
          const params = new URLSearchParams();
          params.set('url', url);
          params.set('fm', format);
          params.set('q', quality.toString());
          modified = true;
          return `url('/.netlify/images?${params.toString()}')`;
        }
      );

      el.setAttribute('style', newStyle);
    });

    return modified ? document.toString() : content;
  });
}
