// @ts-check
const { AssetCache } = require("@11ty/eleventy-fetch");
module.exports = function(eleventyConfig, options) {
  eleventyConfig.addGlobalData
  const cache = new AssetCache('import_map_rhds');
  eleventyConfig.addGlobalData('importMap', async function(configData) {
    const map = await (cache.isCacheValid(options.cacheFor ?? '1d') ? cache.getCachedValue() : fetchIt(options, cache));
    const additional = await options?.additionalImports?.call(this, configData) ?? {}
    const json = {...map}
    for (const [key, value] of Object.entries(additional))
      json.imports[key] = value;
    return json;
  });
}

async function fetchIt(options, cache) {
  console.log('Generating import map...');
  const { Generator } = await import('@jspm/generator');
  const generator = new Generator({ env: ['production', 'browser', 'module'] });
  await generator.install(options.specs);
  const map = generator.getMap();
  await cache.save(map, 'json');
  console.log('  ...Done!');
  return map;
}
