/** @param{import('@11ty/eleventy').UserConfig} eleventyConfig */
export function FontsPlugin(eleventyConfig) {
  eleventyConfig.addFilter('googleFonts', fonts => `https://fonts.googleapis.com/css2?${fonts.map(x =>
    `family=${x.replaceAll(' ', '+')}`).join('&')}&display=swap`);
};
