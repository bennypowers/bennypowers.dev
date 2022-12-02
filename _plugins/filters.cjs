/**
 * @param {string} content
 * @return {string}
 */
function abbrs(content) {
  let replaced = content;
  for (const { name, title } of this.ctx.abbrs ?? []) {
    if (name && title)
      replaced = replaced.replaceAll(name, `<abbr title="${title}">${name}</abbr>`)
        // shitty workaround for a shitty problem
       .replaceAll(
        `<a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/<abbr title="Accessible Rich Internet Applications">ARIA</abbr>`,
        `<a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/`)
        .replaceAll(
        `aria-label="<abbr title="accessibility">a11y</abbr>"`,
        `aria-label="a11y"`)
        .replaceAll(
        `href="#<abbr title="accessibility">a11y</abbr>`,
        `href="#a11y`);
  }
  return replaced;
}

/**
 * @param {string|Date} d
 * @param {Intl.DateTimeFormatOptions} opts
 * @return { string }
 */
function formatDate(d, opts) {
  if (d instanceof Date) {
    return new Intl.DateTimeFormat('en-US', opts).format(d);
  } else {
    try {
      const date = new Date(d);
      return new Intl.DateTimeFormat('en-US', opts).format(date);
    } catch (e) {
      return d
    }
  }
}

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter('abbrs', abbrs);
  eleventyConfig.addFilter('formatDate', formatDate);
};
