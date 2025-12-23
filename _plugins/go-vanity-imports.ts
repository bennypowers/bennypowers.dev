import type { UserConfig } from '@11ty/eleventy';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';

/**
 * Plugin to generate Go vanity import pages as raw XHTML
 * Bypasses 11ty's HTML processing to preserve self-closing tags and XML declaration
 */
export function GoVanityImportsPlugin(eleventyConfig: UserConfig) {
  eleventyConfig.on('eleventy.after', async function({ dir }) {
    // Read goPackages data directly
    const dataPath = join(dir.input, '_data/goPackages.yaml');
    const yamlContent = await readFile(dataPath, 'utf-8');
    const goPackages = YAML.parse(yamlContent);

    if (!Array.isArray(goPackages)) {
      console.warn('[go-vanity-imports] No goPackages data found or invalid format');
      return;
    }

    console.log(`[go-vanity-imports] Generating ${goPackages.length} go-import pages...`);

    for (const pkg of goPackages) {
      const vcs = pkg.vcs || 'git';
      const home = pkg.goSource?.home || pkg.repoUrl;

      const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="go-import" content="${pkg.importPath} ${vcs} ${pkg.repoUrl}" />
${pkg.goSource ? `<meta name="go-source" content="${pkg.importPath} ${pkg.goSource.home} ${pkg.goSource.directory} ${pkg.goSource.file}" />` : ''}
<meta http-equiv="refresh" content="0;url=${home}" />
<title>${pkg.importPath}</title>
</head>
<body>
<p>Redirecting to <a href="${home}">${pkg.importPath}</a>...</p>
</body>
</html>`;

      const pkgOutputDir = join(dir.output, pkg.name);
      const outputPath = join(pkgOutputDir, 'go-import.html');

      await mkdir(pkgOutputDir, { recursive: true });
      await writeFile(outputPath, xhtml, 'utf-8');
    }

    console.log('[go-vanity-imports] ...done!');
  });
}
