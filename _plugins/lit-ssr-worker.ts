import type { RenderInfo } from '@lit-labs/ssr';
import type { CSSResult, CSSResultOrNative, LitElement } from 'lit';
import type { Thunk, ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderRequestMessage, RenderResponseMessage } from './lit-ssr.js';

import '@lit-labs/ssr/lib/install-global-dom-shim.js';

import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import { register as registerTS } from 'tsx/esm/api';

import { register } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { html } from 'lit';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { renderValue } from '@lit-labs/ssr/lib/render-value.js';

import Piscina from 'piscina';
import { transform, Features } from 'lightningcss';

interface WorkerInitData {
  imports: string[];
}

const { imports } = Piscina.workerData as WorkerInitData;

registerTS();
register('./css-loader.js', import.meta.url);

for (const bareSpec of imports) {
  const conventionalTagName = bareSpec.split('/').pop()?.split('.').shift();
  if (!conventionalTagName) {
    throw new Error(`${bareSpec} does not appear to be an element module`);
  }
  if (!customElements.get(conventionalTagName)) {
    const spec = pathToFileURL(resolve(process.cwd(), bareSpec)).href;
    try {
      await import(spec);
    } catch (e) {
      console.warn(`[lit-ssr] Failed to load ${bareSpec}:`, (e as Error)?.message);
    }
  }
}

class Gnome2SSRRenderer extends LitElementRenderer {
  static styleCache = new Map<string, string>();

  override renderShadow(renderInfo: RenderInfo): ThunkedRenderResult {
    const result: (string | Thunk)[] = [];
    const styles = (this.element.constructor as typeof LitElement).elementStyles;
    if (styles !== undefined && styles.length > 0) {
      result.push('<style>');
      for (const style of styles) {
        result.push(Gnome2SSRRenderer.#processCSS((style as CSSResult).cssText));
      }
      result.push('</style>');
    }
    // @ts-expect-error: accessing internal render method
    result.push(() => renderValue(this.element.render(), renderInfo));
    return result;
  }

  static #processCSS(cssText: string): string {
    if (!Gnome2SSRRenderer.styleCache.has(cssText)) {
      try {
        const { code } = transform({
          filename: 'constructed-stylesheet.css',
          code: Buffer.from(cssText),
          minify: true,
          include: Features.Nesting,
        });
        Gnome2SSRRenderer.styleCache.set(cssText, code.toString());
      } catch {
        Gnome2SSRRenderer.styleCache.set(cssText, cssText);
      }
    }
    return Gnome2SSRRenderer.styleCache.get(cssText)!;
  }
}

class UnsafeHTMLStringsArray extends Array {
  public raw: readonly string[];
  constructor(string: string) {
    super();
    this.push(string);
    this.raw = [string];
  }
}

const elementRenderers = [Gnome2SSRRenderer];

export default async function renderPage({
  page,
  content,
}: RenderRequestMessage): Promise<RenderResponseMessage> {
  const start = performance.now();
  try {
    const tpl = html(new UnsafeHTMLStringsArray(content));
    const result = render(tpl, { elementRenderers } as unknown as RenderInfo);
    const rendered = await collectResult(result);
    const durationMs = performance.now() - start;
    return { page, rendered, durationMs };
  } catch (e) {
    console.warn(`[lit-ssr] Failed to render ${page.outputPath}:`, (e as Error)?.message);
    return { page, durationMs: performance.now() - start };
  }
}
