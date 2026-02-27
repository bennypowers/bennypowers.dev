                                                
                                                                    
                                                                                     
                                                                                

import '@lit-labs/ssr/lib/install-global-dom-shim.js';

import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import { register as registerTS } from 'tsx/esm/api';

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { html } from 'lit';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { renderValue } from '@lit-labs/ssr/lib/render-value.js';

import Piscina from 'piscina';
import { transform, Features } from 'lightningcss';

;                         
                    
 

const { imports } = Piscina.workerData                  ;

registerTS();

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
      console.warn(`[lit-ssr] Failed to load ${bareSpec}:`, (e         )?.message);
    }
  }
}

class Gnome2SSRRenderer extends LitElementRenderer {
  static styleCache = new Map               ();

           renderShadow(renderInfo            )                      {
    return [
      this.#renderStyles(),
      () => {
        // @ts-expect-error: accessing internal render method
        const templateResult = this.element.render();
        return renderValue(templateResult, renderInfo);
      },
    ];
  }

  #renderStyles()        {
    const styles = (this.element.constructor                     ).elementStyles;
    if (styles !== undefined && styles.length > 0) {
      return () => [
        '<style>',
        ...this.#thunkStyles(styles),
        '</style>',
      ];
    } else {
      return () => '';
    }
  }

  #thunkStyles(styles                     )          {
    return styles.flatMap(style => {
      const { cssText } = style             ;
      if (!Gnome2SSRRenderer.styleCache.has(cssText)) {
        const processed = () => {
          try {
            const { code } = transform({
              filename: 'constructed-stylesheet.css',
              code: Buffer.from(cssText),
              minify: true,
              include: Features.Nesting,
            });
            return code.toString();
          } catch {
            return cssText;
          }
        };
        Gnome2SSRRenderer.styleCache.set(cssText, processed);
      }
      return [Gnome2SSRRenderer.styleCache.get(cssText) ];
    });
  }
}

class UnsafeHTMLStringsArray extends Array {
         raw                   ;
  constructor(string        ) {
    super();
    this.push(string);
    this.raw = [string];
  }
}

const elementRenderers = [Gnome2SSRRenderer];

export default async function renderPage({
  page,
  content,
}                      )                                 {
  const start = performance.now();
  try {
    const tpl = html(new UnsafeHTMLStringsArray(content));
    const result = render(tpl, { elementRenderers }                         );
    const rendered = await collectResult(result);
    const durationMs = performance.now() - start;
    return { page, rendered, durationMs };
  } catch (e) {
    console.warn(`[lit-ssr] Failed to render ${page.outputPath}:`, (e         )?.message);
    return { page, durationMs: performance.now() - start };
  }
}
