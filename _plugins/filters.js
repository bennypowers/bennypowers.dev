import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * @param {string} content
 * @return {string}
 */
function abbrs(content) {
  let replaced = content;
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

/**
 * @see https://mozilla.github.io/nunjucks/templating.html#groupby
 * @param {object[]} array
 * @param {string} prop
 */
function groupby(array, prop) {
  const obj = {};
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

/**
 * @param {{ [s: string]: any; } | ArrayLike<any>} obj
 * @param {string | string[]} props
 */
const omit = (obj,props) =>
  (Object.fromEntries(Object.entries(obj)
    .filter(([x]) =>
      !props.includes(x))))

/**
 * @param {string|Date} d
 * @param {Intl.DateTimeFormatOptions & { lang: string }} opts
 * @return { string }
 */
function formatDate(d, opts) {
  const { lang = 'en-US', ...init } = opts;
  if (d instanceof Date) {
    return new Intl.DateTimeFormat(lang, init).format(d);
  } else {
    try {
      const date = new Date(d);
      return new Intl.DateTimeFormat(lang, init).format(date);
    } catch (e) {
      return d
    }
  }
}

/**
 * @param {string} content
 */
function linkifyHashtags(content) {
  return content.replace(/(\s*)#(\w+)(\s*)/g, function(_,pre, tag,post) {
    return /* html */`${pre}<a href="https://social.bennypowers.dev/tags/${tag.toLowerCase()}">#${tag}</a>${post}`;
  })
}

/**
 * @param {string | number} str
 */
function translate(str, lang = this?.lang ?? this.$data?.lang ?? 'en') {
  const i18n = this.i18n ?? this.$data?.i18n;
  return i18n?.[lang]?.[str] ?? str;
}

/** @param{import('@11ty/eleventy').UserConfig} eleventyConfig */
export function FiltersPlugin(eleventyConfig) {
  eleventyConfig.addFilter('abbrs', abbrs);
  eleventyConfig.addFilter('omit', omit);
  eleventyConfig.addFilter('translate', translate);
  eleventyConfig.addFilter('isSameDay', isSameDay);
  eleventyConfig.addFilter('formatDate', formatDate);
  eleventyConfig.addFilter('linkifyHashtags', linkifyHashtags);
  eleventyConfig.addJavaScriptFunction('groupby', groupby);
  eleventyConfig.addFilter('include', async function includeFilter(/** @type {string} */ path) {
    const resolved = join(dirname(new URL(import.meta.url).pathname), '..', '_includes', path)
    const content = await readFile(resolved, 'utf8');
    return content;
  });
};
