const linkedom = require('linkedom');
const EleventyFetch = require('@11ty/eleventy-fetch');

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/** @typedef {{ ogImage?: Partial<Record<'url'|'width'|'height'|'type', string>> } & Record<`og${string}`, string>} OpenGraphCardData */

/**
 * @param {string} requestUrl
 */
async function getOpenGraphCardData(requestUrl) {
  try {
    const html = await EleventyFetch(requestUrl, { type: 'text', duration: '1w' });
    const { document } = linkedom.parseHTML(html)
    return Array.from(document.querySelectorAll('meta[property^="og:"]')).reduce((acc, meta) => {
      const content = meta.getAttribute('content');
      const property = meta.getAttribute('property').replace('og:', '');
      if (property.startsWith('image')) {
        acc.ogImage ??= {};
        if (property === 'image') {
          acc.ogImage.url = content;
        } else {
          acc.ogImage[property.replace('image:', '').replace(/_(.)/g, (_, x) => x.toUpperCase())] = content;
        }
      } else {
        acc[`og${capitalize(property)}`] = content;
      }
      return acc;
    }, /**@type{OpenGraphCardData}*/({ requestUrl }));
  } catch (e) { console.log(e); }
}

/**
 * @param {string} content
 */
async function appendOpenGraphCard(content) {
  const { document } = linkedom.parseHTML(content);
  const firstLink = document.querySelector('a[href]:not(.u-url)');
  if (!firstLink) return content;
  const href = firstLink.getAttribute('href');
  const data = await getOpenGraphCardData(href);
  if (data) {
    // chop off the upstream embed link
    const last = Array.from(document.querySelectorAll(`a[href="${href}"]`)).pop();
    if (last !== firstLink) {
      last.remove();
    }
    const card = `<opengraph-card href="${href}"></opengraph-card>`;
    return /* html */`${document.toString()}${card}`;
  } else {
    return content;
  }
}

/** @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter('getOpenGraphCardData', getOpenGraphCardData);
  eleventyConfig.addFilter('appendOpenGraphCard', appendOpenGraphCard);
}
