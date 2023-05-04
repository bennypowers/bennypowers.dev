(function() {
  /** @param {Document|ShadowRoot} root */
  function polyfillDSD(root) {
    for (const template of root.querySelectorAll('template[shadowroot],template[shadowrootmode]')) {
      if (template instanceof HTMLTemplateElement) {
        const mode =
          /** @type{'open'|'closed'} */
          (template.getAttribute('shadowrootmode') ?? template.getAttribute('shadowroot'));
        const shadowRoot = template.parentElement.attachShadow({ mode });
        shadowRoot.appendChild(template.content);
        template.remove();
        polyfillDSD(shadowRoot);
      }
    }
  }
  if (!HTMLTemplateElement.prototype.hasOwnProperty("shadowRoot")) polyfillDSD(document);

}());
