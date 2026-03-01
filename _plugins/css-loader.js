import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    const escaped = source.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('$', '\\$');
    return {
      format: 'module',
      source: `import { css } from 'lit';\nexport default css\`${escaped}\`;`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
