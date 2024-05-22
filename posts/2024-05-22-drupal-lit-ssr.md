---
title: Server Rendering Lit Web Components with Drupal
published: true
audience: Drupal admins, web component developers, performance weebs. 
tldr: |
  Server-rendered web components require no javascript up front. Declarative
  Shadow DOM let's you render your components' shadow roots before the page 
  finishes loading. While the Lit framework's utilities for SSR are still
  experimental, we can write a proof-of-concept to integrate with Drupal.
coverImageAlt: drupal logo facing lit logo
coverImage: /assets/images/drupal-lit-ssr.png
---

<script type="module">
import mermaid from 'https://esm.sh/mermaid';
const match = window.matchMedia?.('(prefers-color-scheme: dark)');
const darkMode = !!match?.matches;
mermaid.initialize({
  darkMode,
  theme: darkMode ? 'dark' : 'base',
});
</script>

A common complaint about web components from the right-wing of frontend developers is that they require JavaScript. This complaint is a perhaps a drop short-sighted, since this [wasn't always the case][polymer1], and hopefully in the [future][dce] will be irrelevant. Regardless of future advancements, though, web components can be used _today_ with JavaScript disabled, if developers expend a bit of effort on server rendering.

Server rendering can mean different things in different scenarios, but in this post we're talking about the process of computing the [Shadow DOM][sd] of a web component on the web server, and printing it's internal HTML in the initial server response. This is possible because of a browser feature called [Declarative Shadow DOM][dsd].

## Overview
We're going to render the shadow roots of custom elements found in [Drupal][drupal] pages, articles, and blocks. Our approach has two major planks:

1. Write an independent, containerized service to render web components
2. Integrate it into Drupal's post-processing pipeline via a custom module

### Goals

We intend to act on the *final, fully-rendered HTML*, or as close to the end of the render process as possible. This is supposed to be a server-framework-agnostic post-processing step.

### Non-Goals

We're not trying to hook deeply into the Drupal render pipeline, we don't want to make Drupal understand what our web components are or how they work. We don't even want our solution to be particularly well written or follow best practices for portability. We're not trying to achieve maximum performance, so streaming (although technically possible) is not on the agenda today. We're also not trying to integrate into any existing Drupal sites or infrastructure: everything should run `localhost`, and be reproducible with minimal fuss.

### Disclaimers

I'm not a Drupal engineer. Thanks to [Stephan Lucero][slucero] for almost all of the Drupal code here. Every line of PHP in this post which looks good and reasonable is to his credit, everything that looks cringe and hacky is my fault. Even the [Node JS][node] code, which is more in my wheelhouse, is not supposed to be "production ready". This is a quick-and-dirty proof-of-concept: i's were left undotted, t's left uncrossed, etc.

Also, when preparing this solution, I couldn't shake the suspicion that Drupal's <abbr title="application programmer interface">API</abbr>'s didn't seem to "want" me to do any of this. The necessary APIs to post-process the final HTML are hidden away in obscure, poorly documented corners. It seems to me entirely likely that a future Drupal release will close the windows which allows this workflow, in favour of totalizing APIs which lock you more concretely into Drupal's rendering pipelines.

Perhaps the most important caveat to mention is that even though the [browser APIs are solid and well-supported][ciudsd], Lit's <abbr title="server-side rendering">SSR</abbr> implementation is [experimental][labs] and [does not yet support](https://github.com/lit/lit/issues/3301) their own context protocol implementation, so that'll break if you try to server render any elements that use `@lit/context`.

### Prerequisites

You'll need to install [Podman][podman] and [`podman-compose`][pmc]. The instructions here should work on a [Fedora][fedora] workstation, you may need to adjust some configuration for other host OSs. You'll also need [Node JS][node] You can always run Fedora in a VM if all else fails. If you like, optionally install [`typescript-language-server`][tsserver] and [`phpactor`][phpactor] and set them up in your editor for improved ergonomics.

## Project Scaffold

We'll need a basic Drupal installation that we can run locally. Let's grab [Wodby's pre-rolled Drupal setup][wodby] to get things moving. 

```sh
git clone https://github.com/wodby/docker4drupal.git drupal-lit-ssr
cd drupal-lit-ssr
```

The business end of this repo is in the [`compose.yml`][compose-spec] files, which set up and orchestrate the drupal web server, php process, and database. We'll work on the drupal setup later on, for now, let's focus on getting our SSR feature up and running.

## The SSR Service
Our SSR service will take the form of a simple HTTP server. It will accept a string of HTML in the body of a POST request, and respond with the server rendered HTML.

We'll use [Koa][koa] for the server, and we'll use the [`@lit-labs/ssr`][llssr] package to handle server rendering our web components. Now, it's important to recognize that this package only works with web components written using the Lit library, and you should also be advised that the package is still marked as **experimental**, so _caveat emptor_, I guess.

### Scaffolding

Start by setting up our directory structure

```sh
mkdir -p containers/lit-ssr/ssr
cd containers/lit-ssr
npm init -y
npm install --save \
  koa \
  @koa/bodyparser \
  @lit-labs/ssr \
  @rhds/elements \
  patch-package
```

Then we'll add `start` and `postinstall` scripts:

```json
"type": "module",
"scripts": {
  "start": "node app.js",
  "postinstall": "patch-package"
}
```

### Rendering

Create `ssr/ssr.js` and write this simple function to render web components in a string of HTML. The first parameter is our initial page HTML, and the second parameter is a list of web component definition modules that we'll need to import.

```js
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export async function ssr(inputHtml, importSpecifiers = []) {
  await import('./shims.js');
  await Promise.all(importSpecifiers.map(spec => import(spec)));
  return collectResult(render(html`${unsafeHTML(inputHtml)}`));
}
```

Our function is dead simple. We defer loading our component definitions until the service is called, then compose a small handful of library functions from `lit` framework:

1. `unsafeHTML` tells Lit not to escape a string of HTML, which if user-generated could be a security risk
2. `html` is the [tagged-template function][taggedtfunc] which makes lit tick. It returns a `TemplateResult` object which describes the eventually-resulting DOM and which parts of it contain interpolations (in our case, none)
3. `render` returns a `RenderResult` which in SSR scenarios is used to hold various data types together so that...
4. `collectResult` loops over the render result and produces our final string.

It can get more complex the more templating features you use, but we're using none of them, since we just act on a static string of HTML, so this should be enough. Future versions of this function might return a stream of HTML, or parse modules in the `<head>` to automatically discover which web components to import on the server.

We need to shim some of the <abbr title="document object model">DOM</abbr> objects our web components use. We'll put those in `ssr/shims.js` and import them at render time, so that we can import our web component definitions in peace. If you use different component files, you make need to shim different objects.

<details><summary><code>ssr/shims.js</code></summary>

```js
class ObserverShim {
  observe() {}
  disconnect() {}
}

globalThis.window ??= globalThis;

globalThis.ErrorEvent ??= Event;
globalThis.IntersectionObserver ??= ObserverShim;
globalThis.MutationObserver ??= ObserverShim;

globalThis.getComputedStyle ??= function() {
  return {
    getPropertyPriority() {},
    getPropertyValue() {},
  }
}
```

</details>

### Server

With that done, let's write our simple server to handle the request. Create `app.js`, and set up a simple Koa server which accepts POST requests with `text/html` mimetype, and we'll have it call out to our render function, which we'll lazily import from `ssr/ssr.js`.

```js
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import { ssr } from './ssr/ssr.js';

const PORT = process.env.PORT ?? 3333;

const app = new Koa();

app.use(bodyParser({
  enableTypes: ['text'],
  extendTypes: {
    text: ['text/html']
  }
}));

app.use(async ctx => {
  if (ctx.method === 'POST') {
    console.log(ctx.request.get('X-Drupal-Url') || 'SSR request received');
    ctx.type = 'text/html';
    ctx.response.body = await ssr(ctx.request.body, [
      '@rhds/elements/rh-card/rh-card.js',
      '@rhds/elements/rh-cta/rh-cta.js',
      '@rhds/elements/rh-footer/rh-footer.js',
    ]);
  }
});

app.listen(PORT, () => {
  console.log(`SSR service listening on ${PORT}`);
});
```

Let's test our service by installing our dependencies and firing up the server.

```sh
npm ci
npm start
```

Send a POST request to http://localhost:3333 with an HTML body containing an `<rh-card>` element, and you should see a result that contains the declarative shadow DOM template.

```http
POST http://localhost:3333
Content-Type: text/html
---

<rh-card>
  <h2 slot="header">Server Rendered Web Components</h2>
  <rh-cta slot="footer">
    <a href="#">Load 'em</a>
  </rh-cta>
</rh-card>
```

![Insomnia HTTP client showing HTML POST request which returns styled content](/assets/images/drupal-lit-ssr-test-request.png)

Ok nice, it worked! What, you got an error? 😈 Actually, the components we're using needed some cheeky patches in order to get them to render on the server, since things like `querySelector` are [not supported](https://lit.dev/docs/ssr/authoring/). Mostly I had to prevent calls to DOM APIs during server render lifecycle. We're already working on [fixing these issues](https://github.com/patternfly/patternfly-elements/pull/2762), so by the time you read this you might not need the patches.

<details><summary><code>patches/@patternfly+pfe-core+3.0.0.patch</code></summary>

```diff-js
  diff --git a/node_modules/@patternfly/pfe-core/core.js b/node_modules/@patternfly/pfe-core/core.js
index 1c4568e..0babe65
--- a/node_modules/@patternfly/pfe-core/core.js
+++ b/node_modules/@patternfly/pfe-core/core.js
@@ -1,8 +1,5 @@
 const noPref = Symbol();
 /** Retrieve an HTML metadata item */
-function getMeta(name) {
-    return document.head.querySelector(`meta[name="${name}"]`)?.content;
-}
 /**
  * A boolean value that indicates if the performance should be tracked.
  * For use in a JS file or script tag; can also be added in the constructor of a component during development.
@@ -10,6 +7,7 @@ function getMeta(name) {
  */
 export function trackPerformance(preference = noPref) {
     if (preference !== noPref) {
+        window.PfeConfig ??= {};
         window.PfeConfig.trackPerformance = !!preference;
     }
     return window.PfeConfig.trackPerformance;
@@ -52,25 +50,4 @@ export class ComposedEvent extends Event {
         });
     }
 }
-const bodyNoAutoReveal = document.body.hasAttribute('no-auto-reveal');
-/** Global patternfly elements config */
-window.PfeConfig = Object.assign(window.PfeConfig ?? {}, {
-    trackPerformance: window.PfeConfig?.trackPerformance ?? getMeta('pf-track-performance') === 'true',
-    // if the body tag has `no-auto-reveal` attribute, reveal immediately
-    // if `<meta name="pf-auto-reveal">` exists, and it's `content` is 'true',
-    // then auto-reveal the body
-    autoReveal: window.PfeConfig?.autoReveal ?? (bodyNoAutoReveal ? !bodyNoAutoReveal
-        : getMeta('pf-auto-reveal') === 'true'),
-    get log() {
-        return !!localStorage.pfeLog;
-    },
-    set log(v) {
-        if (v) {
-            localStorage.setItem('pfeLog', `${true}`);
-        }
-        else {
-            localStorage.removeItem('pfeLog');
-        }
-    },
-});
 //# sourceMappingURL=core.js.map
diff --git a/node_modules/@patternfly/pfe-core/functions/context.js b/node_modules/@patternfly/pfe-core/functions/context.js
index 2a1e6ea..7d7ffbe
--- a/node_modules/@patternfly/pfe-core/functions/context.js
+++ b/node_modules/@patternfly/pfe-core/functions/context.js
@@ -1,8 +1,11 @@
+import { isServer } from 'lit';
 import { ContextRoot, createContext } from '@lit/context';
 let root;
 function makeContextRoot() {
     root = new ContextRoot();
-    root.attach(document.body);
+    if (!isServer) {
+      root.attach(document.body);
+    }
     return root;
 }
 /**

```

</details>
<details><summary><code>patches/@rhds+elements+1.4.1.patch</code></summary>

```diff-js
diff --git a/node_modules/@rhds/elements/elements/rh-card/rh-card.js b/node_modules/@rhds/elements/elements/rh-card/rh-card.js
index 4c8e5e5..e36146d 100644
--- a/node_modules/@rhds/elements/elements/rh-card/rh-card.js
+++ b/node_modules/@rhds/elements/elements/rh-card/rh-card.js
@@ -46,7 +46,7 @@ let RhCard = class RhCard extends LitElement {
         </header>
         <div id="body"
              part="body"
-             class="${classMap({ empty: !this.querySelector(':not([slot])') })}">
+             class="${classMap({ empty: !this.querySelector?.(':not([slot])') })}">
           <slot></slot>
         </div>
         <footer id="footer"
diff --git a/node_modules/@rhds/elements/elements/rh-footer/rh-footer.js b/node_modules/@rhds/elements/elements/rh-footer/rh-footer.js
index a9cc6b8..f8ca626 100644
--- a/node_modules/@rhds/elements/elements/rh-footer/rh-footer.js
+++ b/node_modules/@rhds/elements/elements/rh-footer/rh-footer.js
@@ -89,7 +89,7 @@ let RhFooter = class RhFooter extends LitElement {
     }
     connectedCallback() {
         super.connectedCallback();
-        __classPrivateFieldSet(this, _RhFooter_compact, !this.screenSize.matches.has('md'), "f");
+        __classPrivateFieldSet(this, _RhFooter_compact, !this.screenSize.matches?.has?.('md'), "f");
         // wire up accessibility aria-labels with unordered lists
         this.updateAccessibility();
     }
@@ -150,7 +150,7 @@ let RhFooter = class RhFooter extends LitElement {
      */
     updateAccessibility() {
         const listsSelector = ':is([slot^=links],[slot=footer-links-primary],[slot=footer-links-secondary]):is(ul)';
-        for (const list of this.querySelectorAll(listsSelector)) {
+        for (const list of this?.querySelectorAll?.(listsSelector) ?? []) {
             // if we already have a label then we assume that the user
             // has wired this up themselves.
             if (!list.hasAttribute('aria-labelledby')) {
@@ -177,7 +177,7 @@ _RhFooter_instances = new WeakSet();
 _RhFooter_renderLinksTemplate = function _RhFooter_renderLinksTemplate(isMobile = false) {
     // gather all of the links that need to be wrapped into the accordion
     // give them a designation of either 'header' or 'panel'
-    const children = Array.from(this.querySelectorAll(':scope > [slot^=links]'));
+    const children = Array.from(this?.querySelectorAll?.(':scope > [slot^=links]')??[]);
     // Update the dynamic slot names if on mobile
     children.forEach((child, i) => child.setAttribute('slot', isMobile ? `links-${i}` : 'links'));
     return !(isMobile && children) ? html `
diff --git a/node_modules/@rhds/elements/lib/ScreenSizeController.js b/node_modules/@rhds/elements/lib/ScreenSizeController.js
index 65b34ed..4bb7a54 100644
--- a/node_modules/@rhds/elements/lib/ScreenSizeController.js
+++ b/node_modules/@rhds/elements/lib/ScreenSizeController.js
@@ -2,7 +2,7 @@ import { Breakpoint2xsMax, Media2xl, MediaLg, MediaMd, MediaSm, MediaXl, MediaXs
 function getMediaQueryListForToken(token) {
     const media = typeof token === 'string' ? `(max-width: ${token})`
         : Object.entries(token).map(x => `(${x.join(':')})`).join(' and ');
-    return matchMedia(`screen and ${media}`);
+    return globalThis.matchMedia?.(`screen and ${media}`) ?? new EventTarget();
 }
 const BREAKPOINTS = {
     '2xs': Breakpoint2xsMax,

```
</details>

### Containerization

Let's write a Containerfile for our SSR service so that we can easily integrate it with Drupal and share it around to other use cases.

```dockerfile
FROM node:22

WORKDIR /app

COPY *.json ./
COPY app.js ./

ADD patches patches
ADD ssr ssr

RUN npm ci

EXPOSE 3333

CMD ["npm", "start"]
```

Test it out with the following commands (from the root dir of the git repo)

```sh
cd ../..
podman build ./containers/lit-ssr/ --rm -t lit-ssr
podman run -p 3333:3333 -it localhost/lit-ssr:latest
```

Resend the request from above to make sure it works, then we can move on to the drupal side.

## The Drupal Setup

First we'll need to edit the `.env` file, changing the project name and base url.

```diff
- PROJECT_NAME=my_drupal10_project
- PROJECT_BASE_URL=drupal.docker.localhost
+ PROJECT_NAME=drupal_lit_ssr
+ PROJECT_BASE_URL=localhost
  PROJECT_PORT=8000
```

### Compose File

Then we need to modify the `compose.override.yml` file. Mostly it's adjustments for podman and selinux, but we'll also add an `ssr` network that we'll use later to communicate between drupal and our ssr service. We're also setting up the bind mount so that we can edit the drupal code in our working directory.

```yaml
services:
  php:
    image: wodby/drupal:$DRUPAL_TAG
    security_opt:
      - label=disable
    environment:
      PHP_FPM_CLEAR_ENV: "no"
      PROJECT_BASE_URL: "${PROJECT_BASE_URL}"
    volumes:
      - ./:/var/www/html:Z
    networks:
      - ssr

  crond:
    image: wodby/drupal:$DRUPAL_TAG
    security_opt:
      - label=disable
    environment:
      PHP_FPM_CLEAR_ENV: "no"
    volumes:
      - ./:/var/www/html:Z

  nginx:
    security_opt:
      - label=disable
    volumes:
      - ./:/var/www/html:Z

  mariadb:
    image: wodby/mariadb:$MARIADB_TAG
    security_opt:
      - label=disable
    container_name: "${PROJECT_NAME}_mariadb"
    stop_grace_period: 30s
    environment:
      MYSQL_ROOT_PASSWORD: $DB_ROOT_PASSWORD
      MYSQL_DATABASE: $DB_NAME
      MYSQL_USER: $DB_USER
      MYSQL_PASSWORD: $DB_PASSWORD
      MYSQL_TRANSACTION_ISOLATION: READ-COMMITTED
    volumes:
      - ./mariadb-init:/docker-entrypoint-initdb.d:Z # Place init .sql file(s) here.

  traefik:
    image: traefik:v2.0
    security_opt:
      - label=disable
    container_name: "${PROJECT_NAME}_traefik"
    command:
      - --api.insecure=true
      - --providers.docker
    ports:
      - "${PROJECT_PORT}:80"
      - '8080:8080' # Dashboard
    volumes:
      - /run/user/1000/podman/podman.sock:/var/run/docker.sock:Z

  ssr:
    build:
      context: ./containers/lit-ssr
      dockerfile: Containerfile
    container_name: "${PROJECT_NAME}_ssr"
    ports:
      - 3333:3333
    networks:
      - ssr
    environment:
      PORT: 3333

networks:
  ssr:
```

We can start our drupal site now

```sh
podman compose up
```

#### Troubleshooting
If it asks you which registry to pick, use docker.io. If you get a permissions error to docket.sock, try this then reboot:
```sh
systemctl --user enable --now podman.socket
loginctl enable-linger $(whoami)
```

Browse to [http://localhost:8000](http://localhost:8000), you'll probably see an error:

> The provided host name is not valid for this server

But that's fine. The wodby project wants us to edit our hosts file to add `drupal.docker.localhost` as aliases for localhost, but that'd suck, so let's just patch up our settings file instead. `ctrl-c` out of podman-compose, then run `podman compose down` just to be sure. In order to edit the files in the container volume without permissions problems, use the unshare command:

```sh
podman compose down
podman unshare
```
then append this config to drupal's core settings file at `web/sites/default/settings.php`.

```php
array_push($settings['trusted_host_patterns'], '^'.getenv('PROJECT_BASE_URL').'$');
```

Now if you restart drupal with `podman compose up` and visit [http://localhost:8000](http://localhost:8000), you should see the drupal installation wizard. Proceed until you end up in the admin screen.

### Configuring Drupal

We now need to do the bare minimum setup in Drupal's admin dashboard in order to add custom element tags to the page.

1. Toggle some admin settings to allow us to insert custom elements in drupal content
2. Turn off caching for dev
3. Write some content with cust omelements
4. Write and install our ssr module


### Admin

Browse to [Administration / Configuration / Development](http://localhost:8000/admin/config/development/settings) and turn off caching by enabling "Twig development mode", and "Do not cache markup", then visit [Administration / Configuration / Content authoring / Text formats and editors](http://localhost:8000/admin/config/content/formats/manage/full_html?destination=/admin/config/content/formats): in the "Full HTML" text format, ensure that "Correct faulty and chopped off HTML" is unchecked (just to be sure our templates render unaltered). Also ensure that "Limit allowed HTML tags and correct faulty HTML" is unchecked.

### Content

We're going to create two types of drupal content containing web components: a basic page and a block.

### Block content

Navigate to Administration / Content, click on the Blocks tab and [create a new block](http://localhost:8000/admin/content/block). I named my block "Red Hat Footer" and gave it the sample content from the [`<rh-footer>` documentation](https://github.com/RedHat-UX/red-hat-design-system/blob/main/elements/rh-footer/demo/footer-universal.html). This element requires you to load some global CSS. Drupal has many idiomatic ways to load global CSS, but we're going to ignore all of that and just add a link element to our block. This is a <abbr>PoC</abbr>, after all. Add this to the content:

```html
<rh-footer-universal>
  <h3 slot="links-primary">Red Hat legal and privacy links</h3>
  <ul slot="links-primary">
    <li><a href="https://redhat.com/en/about/company">About Red Hat</a></li>
    <li><a href="https://redhat.com/en/jobs">Jobs</a></li>
    <li><a href="https://redhat.com/en/events">Events</a></li>
    <li><a href="https://redhat.com/en/about/office-locations">Locations</a></li>
    <li><a href="https://redhat.com/en/contact">Contact Red Hat</a></li>
    <li><a href="https://redhat.com/en/blog">Red Hat Blog</a></li>
    <li><a href="https://redhat.com/en/about/our-culture/diversity-equity-inclusion">Diversity, equity, and inclusion</a></li>
    <li><a href="https://coolstuff.redhat.com/">Cool Stuff Store</a></li>
    <li><a href="https://www.redhat.com/en/summit">Red Hat Summit</a></li>
  </ul>
  <rh-footer-copyright slot="links-secondary">© 2022 Red Hat, Inc.</rh-footer-copyright>
  <h3 slot="links-secondary" hidden>Red Hat legal and privacy links</h3>
  <ul slot="links-secondary">
    <li><a href="https://redhat.com/en/about/privacy-policy">Privacy statement</a></li>
    <li><a href="https://redhat.com/en/about/terms-use">Terms of use</a></li>
    <li><a href="https://redhat.com/en/about/all-policies-guidelines">All policies and guidelines</a></li>
    <li><a href="https://redhat.com/en/about/digital-accessibility">Digital accessibility</a></li>
  </ul>
</rh-footer-universal>

<link rel="stylesheet"
      href="https://ux.redhat.com/assets/packages/@rhds/elements/elements/rh-footer/rh-footer-lightdom.css">
```

Make sure to select the "Full HTML" text format, then click "Save and Configure". On the next page, set the region to "Footer Bottom".

If you reload the main page you won't see the footer, even though it will appear in the page source. That's fine, since we haven't connected the SSR service yet.

### Page content

Next we'll add a Drupal Page. Visit [Home / Add Content](http://localhost:8000/node/add/page/). Call it whatever you want and add the content from our earlier test:

```html
<rh-card>
  <h2 slot="header">Server Rendered Web Components</h2>
  <rh-cta slot="footer">
    <a href="#">Load 'em</a>
  </rh-cta>
</rh-card>
```

Save the page and view it at [http://localhost:8000/node/1](http://localhost:8000/node/1). Like the footer, it won't yet be fully styled, so let's build our drupal ssr module.

### Drupal SSR Module

Drupal modules are how you're supposed to customize your drupal instance, so let's create one for our SSR service

```sh
mkdir -p web/modules/custom/lit_ssr/src/EventSubscriber/
touch web/modules/custom/lit_ssr/src/EventSubscriber/SsrPostProcessSubscriber.php 
touch web/modules/custom/lit_ssr/lit_ssr.info.yml
touch web/modules/custom/lit_ssr/lit_ssr.services.yml
```

Add some cheerful metadata to info.yml.

```yml
name: Lit SSR Module
description: Experimental Lit SSR support
package: Custom

type: module
core_version_requirement: ^9.4 || ^10
```

In the services.yml file, add this content which tells Drupal how to load our Subscriber class

```yml
services:
  lit_ssr.ssr_post_process_subscriber:
    class: Drupal\lit_ssr\EventSubscriber\SsrPostProcessSubscriber
    tags:
      - { name: event_subscriber }
```

Now we're ready to add the business end of our module, which will call out to our SSR service for each page render, which in Drupal-speak happens in the "kernel response" event. Clear as day!

```php
<?php

declare(strict_types=1);

namespace Drupal\lit_ssr\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * An event subscriber to post-process page markup through SSR.
 */
final class SsrPostProcessSubscriber implements EventSubscriberInterface {

  protected static $ssr_url = 'http://drupal_lit_ssr_ssr:3333';

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::RESPONSE => ['onKernelResponse'],
    ];
  }

  /**
   * Kernel response event handler.
   */
  public function onKernelResponse(ResponseEvent $event): void {

  }

}
```

The `onKernelResponse` handler needs to do two things, (1) check the URL of the page that Drupal is rendering and (2) replace it's content with the SSR'd HTML if the URL is good

```php
$response = $event->getResponse();
$url = $event->getRequest()->getUri();
if ($this->is_valid_ssr_url($url) && $content = $response->getContent()) {
  // Process through SSR.
  $processed = $this->processSsr($content, $url);

  // Update the processed data back into the content.
  $response->setContent($processed);
}
```

Let's add a done-is-better-than-perfect validator method:
```php
protected function is_valid_ssr_url(string $url): bool {
  return (is_string($path = parse_url($url, PHP_URL_PATH))
          && !str_starts_with($path, '/admin/')
          && !str_starts_with($path, '/block/')
          && !str_starts_with($path, '/editor/')
          && !str_starts_with($path, '/node/add/')
          && !str_ends_with($path, '.js')
          && !str_ends_with($path, '.css')
         );
}
```
Ok then now that we're reasonably confident we won't crash when trying to process the wrong content, let's write the star of the show, our function which calls out to the SSR service.

```php
/**
 * Submit HTML for processing through the SSR service.
 *
 * @param string $html
 *   The HTML string to be processed through the SSR service.
 *
 * @return string
 *   The processed HTML or the original markup if unsuccessful.
 */
protected function processSsr(string $html, string $url): string {
  $client = \Drupal::httpClient();
  $response = $client->request('POST', self::$ssr_url, [
    'body' => $html,
    'headers' => [
      'X-Drupal-Url' => $url,
      'Content-Type' => 'text/html',
      'Accept'     => 'text/html',
    ],
  ]);

  if ($response->getStatusCode() != 200) {
    return $html;
  }
  else {
    return $response->getBody()->getContents();
  }
}
```

At this point, all our software is ready to go, we just need to activate the Drupal module. Visit [Extend](http://localhost:8000/admin/modules), check the "Lit SSR" module, then click the "Install" button at the bottom of the page. Now, when you return to your [page](http://localhost:8000/node/1), you should see the rendered components. Go ahead and [disable javascript using dev tools][disablejs] and you should still see them fully rendered, with actual shadow roots attached.

![Screenshot of server rendered web components](/assets/images/ssrd-lit-drupal.png)

## Outcomes

What have we learned? We can hook into drupal CMS's rendering pipeline at the last minute, processing a stream of HTML by rendering the shadow roots of web components, a job which would otherwise require client-side javascript. The resulting fully-rendered HTML works even without javascript and doesn't require any hacks like compiled CSS. All our CSS custom properties and [CSS shadow parts][parts] will still work as intended.

You can see a fully-realized example [here](https://github.com/bennypowers/drupal-lit-ssr-experimental).

Lit provides a "hydration" module which helps to bring the client-side javascript for our components online if and once it hits the page, but that's out of scope of this post.

We've also seen how drupal's internals are not particularly ergonomic for this case, and that the Lit SSR library is yet immature. God willing, a further entry in this series will explore edge-side alternatives to this server-side technique, so stay tuned.

[polymer1]: https://polymer-library.polymer-project.org/1.0/docs/devguide/feature-overview
[dce]: https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md
[sd]: https://dom.spec.whatwg.org/#concept-shadow-tree
[dsd]: https://html.spec.whatwg.org/multipage/scripting.html#attr-template-shadowrootmode
[drupal]: https://www.drupal.org/
[node]: https://nodejs.org
[ciudsd]: https://caniuse.com/declarative-shadow-dom
[labs]: https://lit.dev/docs/libraries/labs/
[slucero]: https://github.com/slucero
[wodby]: https://wodby.com/docs/1.0/stacks/drupal/
[compose-spec]: https://github.com/compose-spec/compose-spec/blob/master/spec.md
[podman]: https://podman.io
[pmc]: https://github.com/containers/podman-compose
[fedora]: https://fedoraproject.org
[tsserver]: https://github.com/typescript-language-server/typescript-language-server
[phpactor]: https://phpactor.readthedocs.io/en/master/
[koa]: https://koajs.com/
[llssr]: https://lit.dev/docs/ssr/overview/
[taggedtfunc]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
[disablejs]: https://www.eviltester.com/post/tips/how-to-turn-javascript-on-off/
[parts]: https://www.w3.org/TR/css-shadow-parts-1/
