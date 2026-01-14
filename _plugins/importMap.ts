import type { UserConfig } from '@11ty/eleventy';
import type { IImportMap } from '@jspm/import-map';
import type { Install } from "@jspm/generator";

import { AssetCache } from "@11ty/eleventy-fetch";

const cache = new AssetCache('import_map_results');

let lastOptions: string;

async function fetchIt(options: ImportMapPluginConfig, cache: AssetCache) {
  const start = performance.now();
  console.log('[eleventy-plugin-jspm]: Generating import map...');
  const { Generator } = await import('@jspm/generator');
  const generator = new Generator({ env: ['production', 'browser', 'module'] });
  await generator.install(options.specs);
  const map = generator.getMap();
  await cache.save(map, 'json');
  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`[eleventy-plugin-jspm]:  ...Done in ${elapsed}ms`);
  return map;
}

interface ImportMapPluginConfig {
  specs: string | Install | (string | Install)[];
  cacheFor?: string;
  additionalImports?: (configData: ImportMapPluginConfig) => Promise<Record<string, string>>;
}

export function ImportMapPlugin(eleventyConfig: UserConfig, options: ImportMapPluginConfig) {
  async function importMap(configData: ImportMapPluginConfig) {
    const serializedOptions = JSON.stringify(options.specs);
    let map: IImportMap;
    if (serializedOptions !== lastOptions) {
      lastOptions = serializedOptions;
      map = await fetchIt(options, cache);
    } else {
      map = !cache.isCacheValid(options.cacheFor ?? '1d')
        ? await fetchIt(options, cache)
        : await cache.getCachedValue();
    }
    const json = structuredClone(map);
    const additional = await options?.additionalImports?.call(this, configData) ?? {}
    for (const [key, value] of Object.entries<string>(additional))
      json.imports[key] = value;
    return json;
  }

  eleventyConfig.addGlobalData('importMap', importMap);
}
