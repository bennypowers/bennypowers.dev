import type { UserConfig } from "@11ty/eleventy";

interface Page {
  rawInput: string;
  templateContent: string;
  data: {
    datePublished?: Date
    date?: Date
  }
}

export interface CollectionApi {
  getFilteredByGlob: (glob: string) => Page[];
}

const getDate = (x: Page) => x.data.datePublished ?? x.data.date;

const byDate = (a: Page, b: Page) =>
    getDate(a) === getDate(b) ? 0
  : getDate(a)   > getDate(b) ? 1
  : -1;

export function PostsPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addCollection('posts', (collectionApi: CollectionApi) => collectionApi
    .getFilteredByGlob('./posts/**/*.md')
    .sort(byDate));
};

