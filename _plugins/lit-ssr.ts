import type { UserConfig } from '@11ty/eleventy';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Piscina } from 'piscina';
import tsBlankSpace from 'ts-blank-space';

export interface RenderRequestMessage {
  content: string;
  page: { inputPath: string; outputPath: string };
}

export interface RenderResponseMessage {
  page: { inputPath: string; outputPath: string };
  rendered?: string;
  durationMs: number;
}

async function redactTSFileInPlace(path: string) {
  const inURL = new URL(path, import.meta.url);
  const outURL = new URL(path.replace('.ts', '.js'), import.meta.url);
  await writeFile(outURL, tsBlankSpace(await readFile(inURL, 'utf8')), 'utf8');
}

const ELEMENT_MODULES = [
  '_elements/gnome2-desktop.ts',
  '_elements/gnome2-session.ts',
  '_elements/gnome2-panel.ts',
  '_elements/gnome2-clock.ts',
  '_elements/gnome2-window-list.ts',
  '_elements/gtk2-button.ts',
  '_elements/gtk2-scrolled-window.ts',
  '_elements/gtk2-window.ts',
  '_elements/desktop-icon.ts',
];

export function LitSSRPlugin(eleventyConfig: UserConfig) {
  let pool: Piscina;

  eleventyConfig.on('eleventy.before', async function() {
    await redactTSFileInPlace('./lit-ssr-worker.ts');
    const filename = fileURLToPath(new URL('lit-ssr-worker.js', import.meta.url));
    pool = new Piscina({
      filename,
      workerData: { imports: ELEMENT_MODULES },
    });
  });

  eleventyConfig.on('eleventy.after', async function() {
    return pool?.close();
  });

  eleventyConfig.addTransform('lit-ssr', async function(content: string) {
    const { outputPath, inputPath } = this.page;
    if (!outputPath?.endsWith?.('.html')) return content;
    // Quick check: skip if no custom elements
    if (!content.includes('gnome2-') && !content.includes('gtk2-') && !content.includes('desktop-icon')) {
      return content;
    }

    const page = { outputPath, inputPath };
    const message: RenderResponseMessage = await pool.run({ page, content });
    if (message.rendered) {
      return trimOuterMarkers(message.rendered);
    }
    return content;
  });
}

function trimOuterMarkers(renderedContent: string) {
  const trimmed = renderedContent
      .replace(/^((<!--[^<>]*-->)|(<\?>)|\s)+/, '')
      .replace(/((<!--[^<>]*-->)|(<\?>)|\s)+$/, '');
  // Ensure doctype is preserved
  if (!trimmed.startsWith('<!')) {
    return `<!doctype html>\n${trimmed}`;
  }
  return trimmed;
}
