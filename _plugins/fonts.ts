import type { UserConfig } from "@11ty/eleventy";

function fontsFilter(fonts: string[]) {
  const url = new URL('css2', 'https://fonts.googleapis.com');
  for (const font of fonts)
        url.searchParams.append('family',font);
  url.searchParams.append('display', 'swap');
  return url.href;
}

export function FontsPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addFilter('googleFonts', fontsFilter);
};
