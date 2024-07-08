const getDate = x => x.data.datePublished ?? x.data.date;
const byDate = (a, b) =>
    getDate(a) === getDate(b) ? 0
  : getDate(a)   > getDate(b) ? 1
  : -1;

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
export function PostsPlugin(eleventyConfig) {
  eleventyConfig.addCollection('posts', collectionApi => collectionApi
    .getFilteredByGlob('./posts/**/*.md')
    .sort(byDate));
};

