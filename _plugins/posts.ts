import type { UserConfig } from "@11ty/eleventy";
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

interface Page {
  rawInput: string;
  templateContent: string;
  data: {
    datePublished?: Date
    date?: Date
    tags?: string[]
  }
}

export interface CollectionApi {
  getFilteredByGlob: (glob: string) => Page[];
  getAll: () => Page[];
}

const getDate = (x: Page) => x.data.datePublished ?? x.data.date;

const notDeck = (x: Page) => !x.data.tags?.includes('deck');

const byDate = (a: Page, b: Page) =>
    getDate(a) === getDate(b) ? 0
  : getDate(a)   > getDate(b) ? 1
  : -1;

export function PostsPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addCollection('posts', (collectionApi: CollectionApi) => collectionApi
    .getFilteredByGlob('./posts/**/*.md')
    .sort(byDate));

  eleventyConfig.addCollection('postsByMonth', (collectionApi: CollectionApi) => {
    const posts = collectionApi.getFilteredByGlob('./posts/**/*.md')
      .filter(notDeck)
      .sort(byDate);
    const months = new Map<string, Page[]>();
    for (const post of posts) {
      const date = getDate(post);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months.has(key)) months.set(key, []);
      months.get(key)!.push(post);
    }
    return [...months.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, posts]) => ({ month, posts: posts.reverse() }));
  });

  eleventyConfig.addCollection('postsByYear', (collectionApi: CollectionApi) => {
    const posts = collectionApi.getFilteredByGlob('./posts/**/*.md')
      .filter(notDeck)
      .sort(byDate);
    const years = new Map<string, { month: string; count: number }[]>();
    for (const post of posts) {
      const date = getDate(post);
      if (!date) continue;
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!years.has(year)) years.set(year, []);
      const yearMonths = years.get(year)!;
      const existing = yearMonths.find(m => m.month === key);
      if (existing) {
        existing.count++;
      } else {
        yearMonths.push({ month: key, count: 1 });
      }
    }
    return [...years.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, months]) => ({
        year,
        months: months.sort((a, b) => b.month.localeCompare(a.month)),
      }));
  });

  const EXCLUDED_TAGS: Set<string> = new Set(
    parseYaml(readFileSync(new URL('../_data/excludedTags.yaml', import.meta.url), 'utf-8'))
  );

  eleventyConfig.addCollection('tagNames', (collectionApi: CollectionApi) => {
    const tagMap = new Map<string, Page[]>();
    for (const post of collectionApi.getAll()) {
      for (const tag of (post as any).data?.tags ?? []) {
        if (EXCLUDED_TAGS.has(tag) || /^resume-/.test(tag)) continue;
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(post);
      }
    }
    return [...tagMap.entries()]
      .filter(([, posts]) => posts.some(p => notDeck(p) && (p as any).url))
      .map(([tag]) => tag)
      .sort();
  });
};

