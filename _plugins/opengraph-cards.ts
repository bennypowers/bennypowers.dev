import type { UserConfig } from '@11ty/eleventy';

import { parseHTML } from 'linkedom';

import EleventyFetch from '@11ty/eleventy-fetch';

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

interface OpenGraphCardData extends Record<`og${string}`, unknown> {
  requestUrl: string;
  ogImage?: Partial<Record<'url' | 'width' | 'height' | 'type', string>>;
}

async function getOpenGraphCardData(requestUrl: string) {
  try {
    const html = await EleventyFetch(requestUrl, { type: 'text', duration: '1w' });
    if (typeof html !== 'string') {
      console.warn(`OpenGraph fetch failed for ${requestUrl}: received ${typeof html}`);
      return;
    }
    const { document } = parseHTML(html)
    return Array.from(document.querySelectorAll<HTMLMetaElement>('meta[property^="og:"]')).reduce((acc, meta) => {
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
    }, { requestUrl } as OpenGraphCardData);
  } catch (e) {
    console.log(e);
  }
}

async function appendOpenGraphCard(content: string) {
  const { document } = parseHTML(content);
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
    const card = /*html*/`<opengraph-card href="${href}"></opengraph-card>`;
    return `${document.toString()}${card}`;
  } else {
    return content;
  }
}

export function OpenGraphCardPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.addFilter('getOpenGraphCardData', getOpenGraphCardData);
  eleventyConfig.addFilter('appendOpenGraphCard', appendOpenGraphCard);
}
