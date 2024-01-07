---
permalink: /building-with-rhds/index.html
templateEngineOverride: njk,md
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Building with Red Hat Design System</title>
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <meta name="theme-color" content="#464a5b">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Benny Powers, Web Developer">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Benny Powers, Web Developer">
    <meta name="msapplication-TileImage" :content="url('/assets/images/manifest/icon-144x144.png')">
    <meta name="msapplication-TileColor" content="#464a5b">
    <meta name="msapplication-tap-highlight" content="no">
    <meta name="author" content="Benny Powers">
    <meta name="date.created" content="01-2017">
    <meta name="HandheldFriendly" content="true">
    <meta name="description" :content="description || 'Benny Powers, Web Developer'">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://ux.redhat.com/assets/redhat/redhat-font/2/webfonts/red-hat-font.css">
    <link rel="stylesheet" href="https://unpkg.com/@rhds/tokens@1.1.2/css/global.css">
    <link rel="stylesheet" href="https://unpkg.com/prism-themes@1.9.0/themes/prism-one-light.min.css">
    <style>
    body { font-family: var(--rh-font-family-body-text); }
    :is(h1,h2,h3,h4,h5,h6) { font-family: var(--rh-font-family-heading); }
    code { font-family: var(--rh-font-family-code); }
    h1 { font-size: var(--rh-font-size-heading-2xl); }
    h2 { font-size: var(--rh-font-size-heading-xl); }
    h3 { font-size: var(--rh-font-size-heading-lg); }
    </style>
    <script type="importmap">
      {
        "imports": {
          "@rhds/elements/": "https://jspm.dev/@rhds/elements/",
          "@patternfly/elements/": "https://jspm.dev/@patternfly/elements/"
        }
      }
    </script>
    <script type="module">
      import '@patternfly/elements/pf-clipboard-copy/pf-clipboard-copy.js';
      import '@rhds/elements/rh-tabs/rh-tabs.js';
      const t = document.getElementById('copy-tpl');
      for (const pre of document.querySelectorAll('pre[class^="lang"]')) {
        const [b] = t.content.cloneNode(true).children;
        const [i] = b.children;
        pre.after((b.addEventListener('click', async function() {
          await navigator.clipboard.writeText(pre.textContent);
          i.icon = 'check';
          await new Promise(r => setTimeout(r, 5_000));
          i.icon = 'copy';
        }), b));
      }
    </script>
  </head>
  <body>
    <template id="copy-tpl">
      <pf-button variant="link">
        <pf-icon icon="copy" size="sm"></pf-icon>
        Copy
      </pf-button>
    </template>

# RHDS Sunday Learning

- Completed project: <https://codepen.io/bennyp/pen/gOEPRQP>

<rh-tabs vertical>
  <rh-tab slot="tab">Step 1: Tokens and Import Map</rh-tab>
  <rh-tab-panel>

```html
<link rel="stylesheet" href="https://unpkg.com/@rhds/tokens@1.1.2/css/global.css">

<script type="importmap">
  { "imports": { "@rhds/elements/": "https://jspm.dev/@rhds/elements/" } }
</script>
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 2: Page Layout</rh-tab>
  <rh-tab-panel>

```html
<section id="products">



</section>
```

```css
[hidden] {
  display: none !important;
}

#products {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--rh-space-lg);
}
```

```js
import '@rhds/elements/rh-card/rh-card.js';
import '@rhds/elements/rh-cta/rh-cta.js';
import '@rhds/elements/rh-tag/rh-tag.js';
import '@rhds/elements/rh-dialog/rh-dialog.js';
import '@rhds/elements/rh-spinner/rh-spinner.js';
import '@rhds/elements/rh-button/rh-button.js';
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 3: A Simple Card</rh-tab>
  <rh-tab-panel>

```html
  <rh-card>
    <h2 slot="header">
      Felafel BePita
    </h2>
    <p>The world's best snack. Comes with chips, pickles, salad, techina, hummus, and harif.</p>
    <rh-cta slot="footer"
            variant="primary">
      <a id="order-pita"
         href="#pita">Order Pita</a>
    </rh-cta>
  </rh-card>
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 4: Image Header</rh-tab>
  <rh-tab-panel>

```html
    <img alt="Pita"
         slot="header"
         title="(image by Gila Brand)"
         src="https://upload.wikimedia.org/wikipedia/commons/3/38/Pita_felafel.jpg"> 
```

```css
rh-card {
  &::part(header) {
    margin: 0;
    padding: 0;
  }
  & img {
    object-position: right;
    object-fit: cover;
    height: 229px;
  }
}
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 5: Price Tag</rh-tab>
  <rh-tab-panel>

```html
    <h2 slot="header">
      Felafel BePita
      <rh-tag color="blue"
              icon="dollar-sign">5</rh-tag>
    </h2>
```

```css
  & > h2 {
    margin-inline: var(--rh-space-2xl);
    display: flex;
    justify-content: space-between;
  }
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 6: Confirm Dialog</rh-tab>
  <rh-tab-panel>

```html
    <rh-dialog id="dialog"
               trigger="order-pita"
               variant="small">
      <h2 slot="header">Order Pita?</h2>
      <rh-button slot="footer">Pay</rh-button>
      <rh-spinner slot="footer"
                  size="md"
                  hidden>Paying...</rh-spinner>
    </rh-dialog>
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 7: A bit of JavaScript for Interactivity</rh-tab>
  <rh-tab-panel>

```js
import {RhButton} from '@rhds/elements/rh-button/rh-button.js';

const products = document.getElementById('products');

products.addEventListener('click', async function(event) {
  if (event.target instanceof RhButton) {
    const button = event.target;
    const dialog =  button.closest('rh-dialog');
    const spinner = dialog.querySelector('rh-spinner');
    spinner.hidden = false;
    button.disabled = true;
    await new Promise(r => setTimeout(r, Math.random() * 5_000));
    spinner.hidden = true;
    button.disabled = false;
    dialog.close();
  }
});
```

  </rh-tab-panel>
  <rh-tab slot="tab">Step 8: Color Palettes</rh-tab>
  <rh-tab-panel>

```html
  <rh-card color-palette="darker">
    <img alt="Shawarma"
         title="image by cyclonebill"
         slot="header"
         src="https://live.staticflickr.com/2307/2223426004_4ab5353495_b.jpg">
    <h2 slot="header">
      Shawarma BeLaffa
      <rh-tag color="green"
              icon="dollar-sign">10</rh-tag>
    </h2>
    <p>Mix lamb and turkey. Comes with hummus/harif, tehina, cabbage, and chips.</p>
    <rh-dialog id="dialog"
               trigger="order-laffa"
               variant="small">
      <h2 slot="header">Order Laffa?</h2>
      <rh-button slot="footer">Pay</rh-button>
      <rh-spinner slot="footer"
                  size="md"
                  hidden>Paying...</rh-spinner>
    </rh-dialog>
    <rh-cta slot="footer"
            variant="primary">
      <a id="order-laffa"
         href="#laffa">Order Laffa</a>
    </rh-cta>
  </rh-card> 

  <rh-card>
    <img alt="Felafel plate"
         slot="header"
         title="image by avixyz"
         src="https://live.staticflickr.com/2727/4249593684_9c53044f1a_b.jpg">
    <h2 slot="header">
      Felafel Plate
      <rh-tag color="blue"
              icon="dollar-sign">15</rh-tag>
    </h2>
    <p>For people who like to eat with a fork. Comes with hummus, salad, lemon, and olive oil.</p>
    <rh-dialog id="dialog"
               trigger="order-plate"
               variant="small">
      <h2 slot="header">Order Plate?</h2>
      <rh-button slot="footer">Pay</rh-button>
      <rh-spinner slot="footer"
                  size="md"
                  hidden>Paying...</rh-spinner>
    </rh-dialog>
    <rh-cta slot="footer"
            variant="primary">
      <a id="order-plate"
         href="#plate">Order Plate</a>
    </rh-cta>
  </rh-card> 
```

  </rh-tab-panel>
</rh-tabs>

  </body>
</html>

