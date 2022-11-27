const { optimize } = require('svgo')

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addExtension('svg', {
    compile: x => () => x,
    compileOptions: {
      permalink() {
        return () => false;
      }
    }
  });
  eleventyConfig.addShortcode('icon', function icon(name, attrs = {}) {
    attrs['aria-label'] ??= attrs.title ?? name;
    return `<svg${Object.entries(attrs).filter(([k]) => k !== '__keywords').map(([name, value]) =>
              ` ${name}="${value}"`).join('')}><use aria-hidden="true" xlink:href="#${name}-icon"></use></svg>`;
  })
};

