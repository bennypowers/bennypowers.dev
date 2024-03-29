/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter('googleFonts', fonts => `https://fonts.googleapis.com/css2?${fonts.map(x =>
    `family=${x.replaceAll(' ', '+')}`).join('&')}&display=swap`);
};
