import type { UserConfig } from '@11ty/eleventy';
import { transform } from './transform.ts';

export function WebCDSDWorkaroundPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addTransform('webc-dsd-slot-workaround', function(content: string) {
    if (this.page.outputPath?.endsWith?.('.html')) {
      return transform(content);
    }
    return content;
  });
}
