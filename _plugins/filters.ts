import type { UserConfig } from '@11ty/eleventy';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

function abbrs(content: string): string {
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
 */
function groupby(array: object[], prop: string) {
  const obj = {};
  for (const item of array) {
    obj[item[prop]] ??= [];
    obj[item[prop]].push(item);
  }
  return obj;
}

function isSameDay(a: string | number | Date, b: string | number | Date): boolean {
  const A = new Date(a);
  const B = new Date(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDay() === B.getDay()
  );
}

const omit = (obj: { [s: string]: any; } | ArrayLike<any>,props: string | string[]) =>
  (Object.fromEntries(Object.entries(obj)
    .filter(([x]) =>
      !props.includes(x))))

function formatDate(
  d: string | Date,
  opts: Intl.DateTimeFormatOptions & { lang: string; },
): string {
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

function linkifyHashtags(content: string) {
  return content.replace(/(\s*)#(\w+)(\s*)/g, function(_,pre, tag,post) {
    return /* html */`${pre}<a href="https://social.bennypowers.dev/tags/${tag.toLowerCase()}">#${tag}</a>${post}`;
  })
}

function translate(str: string | number, lang = this?.lang ?? this.$data?.lang ?? 'en') {
  const i18n = this.i18n ?? this.$data?.i18n;
  return i18n?.[lang]?.[str] ?? str;
}

export function FiltersPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addFilter('abbrs', abbrs);
  eleventyConfig.addFilter('omit', omit);
  eleventyConfig.addFilter('translate', translate);
  eleventyConfig.addFilter('isSameDay', isSameDay);
  eleventyConfig.addFilter('formatDate', formatDate);
  eleventyConfig.addFilter('linkifyHashtags', linkifyHashtags);
  eleventyConfig.addJavaScriptFunction('groupby', groupby);
  eleventyConfig.addFilter('include', async function includeFilter(path: string) {
    const resolved = join(dirname(new URL(import.meta.url).pathname), '..', '_includes', path)
    const content = await readFile(resolved, 'utf8');
    return content;
  });
};
