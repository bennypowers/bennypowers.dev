const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

/**
 * @param {string} content
 * @return {string}
 */
function abbrs(content) {
  let replaced = content;
  // console.log(this)
  for (const { name, title } of this.ctx?.abbrs ?? []) {
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

/** @see https://mozilla.github.io/nunjucks/templating.html#groupby */
function groupby(array, prop) {
  const obj = {}
  for (const item of array) {
    obj[item[prop]] ??= [];
    obj[item[prop]].push(item);
  }
  return obj;
}

/**
 * @param {string | number | Date} a
 * @param {string | number | Date} b
 * @return {boolean}
 */
function isSameDay(a, b) {
  const A = new Date(a);
  const B = new Date(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDay() === B.getDay()
  );
}

const omit = (obj, props) =>
  Object.fromEntries(Object.entries(obj).filter(([x]) =>
    !props.includes(x)))

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

function linkifyHashtags(content) {
  return content.replace(/(\s*)#(\w+)(\s*)/g, function(_,pre, tag,post) {
    return /*html*/`${pre}<a href="https://social.bennypowers.dev/tags/${tag.toLowerCase()}">#${tag}</a>${post}`;
  })
}

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter('abbrs', abbrs);
  eleventyConfig.addFilter('omit', omit);
  eleventyConfig.addFilter('isSameDay', isSameDay);
  eleventyConfig.addFilter('formatDate', formatDate);
  eleventyConfig.addFilter('linkifyHashtags', linkifyHashtags);
  eleventyConfig.addJavaScriptFunction('groupby', groupby);
  eleventyConfig.addFilter('include', async function includeFilter(path) {
    const resolved = join(__dirname, '..', '_includes', path)
    const content = await readFile(resolved, 'utf8');
    return content;
  });
};
