(function() {
  /** @param{Document|ShadowRoot} x */
  function polyfill(x) {
    /** @type {NodeListOf<HTMLTemplateElement>}*/
    const ts = x.querySelectorAll('template[shadowrootmode],template[shadowroot]');
    for (const t of ts) {
      const mode = /** @type {ShadowRootMode} */(t.getAttribute('shadowrootmode') ?? t.getAttribute('shadowroot'));
      const shadowRoot = t.parentElement.attachShadow({ mode });
      shadowRoot.appendChild(t.content);
      t.remove();
      polyfill(shadowRoot);
    }
  }

  if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot'))
    polyfill(document);
}());
