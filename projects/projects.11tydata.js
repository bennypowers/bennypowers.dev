import EleventyFetch from '@11ty/eleventy-fetch';
import markdownIt from 'markdown-it';

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

async function fetchGithubReadme(repo) {
  const start = performance.now();
  const url = `https://raw.githubusercontent.com/${repo}/main/README.md`;

  try {
    const readme = await EleventyFetch(url, {
      duration: '1d',
      type: 'text',
    });

    let readmeStr = String(readme);

    // Fix relative image paths to point to GitHub
    readmeStr = readmeStr.replace(
      /!\[(.*?)\]\(\.\/docs\/(.*?)\)/g,
      `![$1](https://raw.githubusercontent.com/${repo}/main/docs/$2)`
    );

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`[projects] Fetched README for ${repo} in ${elapsed}ms`);
    return md.render(readmeStr);
  } catch (error) {
    console.error(`[GitHub README] Failed to fetch README for ${repo}:`, error);
    const name = repo.split('/').pop();
    return `<h1>${name}</h1><p>README not available. See <a href="https://github.com/${repo}">GitHub</a> for details.</p>`;
  }
}

export default {
  eleventyComputed: {
    readme: async (data) => {
      if (data.repo) {
        return fetchGithubReadme(data.repo);
      }
      return null;
    },
  },
};
