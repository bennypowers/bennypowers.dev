/** @param {string[]} fonts */
function fontsFilter(fonts) {
  const url = new URL('css2', 'https://fonts.googleapis.com');
  for (const font of fonts)
        url.searchParams.append('family',font);
  url.searchParams.append('display', 'swap');
  return url.href;
}

/** @param{import('@11ty/eleventy').UserConfig} eleventyConfig */
export function FontsPlugin(eleventyConfig) {
  eleventyConfig.addFilter('googleFonts', fontsFilter);
};
