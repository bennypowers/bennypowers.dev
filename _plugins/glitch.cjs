/**
 * @param{import('@11ty/eleventy/src/UserConfig.js')} eleventyConfig
 */
module.exports = function(eleventyConfig) {
  eleventyConfig.addShortcode('glitch', function(embedCode, ...options) {
    options = options.filter(Boolean);
    const embedUrl = new URL(`/embed/${embedCode}`, 'https://glitch.com');
    const flags = new Set(options);
    const file = options.find(x => x.startsWith('file='))?.replace('file=', '') ?? 'index.html';
    embedUrl.searchParams.set('path', file);
    if (flags.has('app'))
      embedUrl.searchParams.set('previewSize', '100');
    else if (flags.has('code'))
      embedUrl.searchParams.set('previewSize', '0');
    if (flags.has('no-files'))
      embedUrl.searchParams.set('sidebarCollapsed', 'true');
    if (flags.has('preview-first'))
      embedUrl.searchParams.set('previewFirst', 'true');
    if (flags.has('no-attribution'))
      embedUrl.searchParams.set('attributionHidden', 'true');
    const url = new URL('/embed', 'https://glitch.com/');
    url.hash = `!${embedUrl.pathname}${embedUrl.search}`;
    return `

<div class="glitch-embed-wrap" style="height: 450px; width: 100%;margin: 1em auto 1.3em">
  <iframe sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation-by-user-activation"
          src="${url.href}" alt="${embedCode} on glitch"
          style="height: 100%; width: 100%; border: 0;margin:0;padding:0"></iframe>
</div>

`;
  })
}
