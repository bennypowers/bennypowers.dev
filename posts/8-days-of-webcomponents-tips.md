---
title: 8 Days of Web Components Tips
published: true
datePublished: 2021-12-05
coverImage: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jbu8sm54svooogakrb4d.jpg
altUrls:
  - https://dev.to/bennypowers/8-days-of-web-components-tips-39o5
tags:
  - web components
  - html
  - javascript
  - hannukah
---

In honour of [Hannukah](https://www.chabad.org/holidays/chanukah/article_cdo/aid/102911/jewish/What-Is-Hanukkah.htm) this year, I undertook to write 8 web components tips, one for each night of the festival. Tonight is the 8th and final night of the festival. The mystics said that this night combines and contains aspects of each of the seven previous nights, so I'd like to share a compilation of those tips with the dev community.

Wishing you and yours a fully Lit Hannukah!

## 1st night: Adding Controllers via TypeScript Decorators 🕯

Did you know you can add reactive controllers to an element via a class or
field decorator? You don't even need to assign it to an instance property!

```ts
/**
 * Adds a given class to a ReactiveElement when it upgrades
 */
export function classy(classString: string): ClassDecorator {
  return function(klass) {
    if (!isReactiveElementClass(klass))
      throw new Error(`@classy may only decorate ReactiveElements.`);

    klass.addInitializer(instance => {
      // Define and add an ad-hoc controller!
      // Look, mah! No instance property!
      instance.addController({
        hostConnected() {
          instance.classList.add(classString);
        },
      });
    });
  };
}

@customElement('pirsumei-nissa') @classy('al-hanissim')
export class PirsumeiNissa extends LitElement {}
```

## 2nd night: Adding Controllers Inside Other Controllers 🕯🕯

Like a delicious [_sufganya_](https://www.wikiwand.com/en/Sufganiyah)
(traditional holiday donut) with many fillings, a Lit component can have
multiple reactive controllers, and controllers can even add other controllers

```ts
export class MutationController<E extends ReactiveElement> implements ReactiveController {
  private logger: Logger;
  
  mo = new MutationObserver(this.onMutation);

  constructor(public host: E, public options?: Options<E>) {
    // Add another controller
    this.logger = new Logger(this.host);
    host.addController(this);
  }

  onMutation(records: MutationRecord[]) {
    this.logger.log('Mutation', records);
    this.options?.onMutation?.(records)
  }

  hostConnected() {
    this.mo.observe(this.host, this.options?.init ?? { attributes: true, childList: true });
  }

  hostDisconnected() {
    this.mo.disconnect();
  }
}
```

## 3rd night: Web Component Context API 🕯🕯🕯

Did you know web components can have context? The protocol is based on composed
events. Define providers & consumers, & share data across the DOM.

https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md

## 4th night: Using SASS, PostCSS, etc. 🕯🕯🕯🕯

Building #webcomponents with #SASS? (You probably don't need it but if you
can't resist…) you can develop using a buildless workflow with [Web Dev
Server](modern-web.dev/) and
[esbuild-plugin-lit-css](http://npm.im/esbuild-plugin-lit-css)

Want to use #PostCSS instead for sweet-sweet future CSS syntax? [No
problem](https://github.com/bennypowers/lit-css/tree/main/packages/esbuild-plugin-lit-css#usage-with-sass-less-postcss-etc)

## 5th night: Stacking Slots 🕯🕯🕯🕯🕯

Who doesn't like a piping hot stack of latkes?

Stack slots to toggle component states. Adding content into the outer slot
automatically 'disables' the inner slot

State management in HTML! 🤯

Check out [@Westbrook's
blog](https://dev.to/westbrook/who-doesnt-love-some-s-3de0/) on the topic:

## 6th night: Better TypeScript Imports 🕯🕯🕯🕯🕯🕯

In #TypeScript 4.5, if you set `preserveValueImports`, you can import the class
definitions of your element dependencies without worrying that TS will elide
the side-effecting value.

```ts
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('lit-candle')
export class LitCandle extends LitElement {
  @property({ type: Boolean }) lit = false;
  
  render() {
    return this.lit ? '🕯' : ' ';
  }
}
```
```ts
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { LitCandle } from './lit-candle.js';

@customElement('lit-menorah')
export class LitMenorah extends LitElement {
  @property({ type: Number }) night = 6;
  
  // Although the value of `LitCandle` isn't used, only the type
  // with `preserveValueImports`, TS 4.5 won't strip the import
  // So you can be sure that `<lit-candle>` will upgrade
  @query('lit-candle') candles: NodeListOf<LitCandle>;
  
  render() {
    return Array.from({ length: 8 }, (_, i) => html`
      <lit-candle ?lit="${(i + 1) <= this.night}"></lit-candle>
    `);
  }
}
```

[live demo](https://lit.dev/playground/#project=W3sibmFtZSI6ImxpdC1tZW5vcmFoLnRzIiwiY29udGVudCI6ImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwgfSBmcm9tICdsaXQnO1xuaW1wb3J0IHsgY3VzdG9tRWxlbWVudCwgcHJvcGVydHksIHF1ZXJ5IH0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuaW1wb3J0IHsgTGl0Q2FuZGxlIH0gZnJvbSAnLi9saXQtY2FuZGxlLmpzJztcbmltcG9ydCAnLi9saXQtY2FuZGxlLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ2xpdC1tZW5vcmFoJylcbmV4cG9ydCBjbGFzcyBMaXRNZW5vcmFoIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIEBwcm9wZXJ0eSh7IHR5cGU6IE51bWJlciB9KSBuaWdodCA9IDY7XG4gIFxuICAvLyBBbHRob3VnaCB0aGUgdmFsdWUgb2YgYExpdENhbmRsZWAgaXNuJ3QgdXNlZCwgb25seSB0aGUgdHlwZVxuICAvLyB3aXRoIGBwcmVzZXJ2ZVZhbHVlSW1wb3J0c2AsIFRTIDQuNSB3b24ndCBzdHJpcCB0aGUgaW1wb3J0XG4gIC8vIFNvIHlvdSBjYW4gYmUgc3VyZSB0aGF0IGA8bGl0LWNhbmRsZT5gIHdpbGwgdXBncmFkZVxuICBAcXVlcnkoJ2xpdC1jYW5kbGUnKSBjYW5kbGVzOiBOb2RlTGlzdE9mPExpdENhbmRsZT47XG4gIFxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oeyBsZW5ndGg6IDggfSwgKF8sIGkpID0-IGh0bWxgXG4gICAgICA8bGl0LWNhbmRsZSA_bGl0PVwiJHsoaSArIDEpIDw9IHRoaXMubmlnaHR9XCI-PC9saXQtY2FuZGxlPlxuICAgIGApO1xuICB9XG59In0seyJuYW1lIjoiaW5kZXguaHRtbCIsImNvbnRlbnQiOiI8IURPQ1RZUEUgaHRtbD5cbjxoZWFkPlxuICA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIuL2xpdC1tZW5vcmFoLmpzXCI-PC9zY3JpcHQ-XG48L2hlYWQ-XG48Ym9keT5cbiAgPGxpdC1tZW5vcmFoIG5pZ2h0PVwiNlwiPjwvbGl0LW1lbm9yYWg-XG48L2JvZHk-XG4ifSx7Im5hbWUiOiJwYWNrYWdlLmpzb24iLCJjb250ZW50Ijoie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsaXRcIjogXCJeMi4wLjBcIixcbiAgICBcIkBsaXQvcmVhY3RpdmUtZWxlbWVudFwiOiBcIl4xLjAuMFwiLFxuICAgIFwibGl0LWVsZW1lbnRcIjogXCJeMy4wLjBcIixcbiAgICBcImxpdC1odG1sXCI6IFwiXjIuMC4wXCJcbiAgfVxufSIsImhpZGRlbiI6dHJ1ZX0seyJuYW1lIjoibGl0LWNhbmRsZS50cyIsImNvbnRlbnQiOiJpbXBvcnQgeyBMaXRFbGVtZW50IH0gZnJvbSAnbGl0JztcbmltcG9ydCB7IGN1c3RvbUVsZW1lbnQsIHByb3BlcnR5IH0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuXG5AY3VzdG9tRWxlbWVudCgnbGl0LWNhbmRsZScpXG5leHBvcnQgY2xhc3MgTGl0Q2FuZGxlIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIEBwcm9wZXJ0eSh7IHR5cGU6IEJvb2xlYW4gfSkgbGl0ID0gZmFsc2U7XG4gIFxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGl0ID8gJ_Cfla8nIDogJyAnO1xuICB9XG59In1d)

## 7th night: GraphQL Web Components 🕯🕯🕯🕯🕯🕯🕯

Looking to add #GraphQL to your frontend? Give [Apollo
Elements](https://apolloelements.dev) a try. Use Apollo reactive controllers
with lit+others, or try a 'functional' library like
[atomic](https://apolloelements.dev/api/libraries/atomic)

```ts
import { ApolloQueryController } from '@apollo-elements/core';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { HelloQuery } from './Hello.query.graphql';

@customElement('hello-query')
export class HelloQueryElement extends LitElement {
  query = new ApolloQueryController(this, HelloQuery);

  render() {
    return html`
      <article class=${classMap({ skeleton: this.query.loading })}>
        <p id="error" ?hidden=${!this.query.error}>${this.query.error?.message}</p>
        <p>
          ${this.query.data?.greeting ?? 'Hello'},
          ${this.query.data?.name ?? 'Friend'}
        </p>
      </article>
    `;
  }
}
```

## 8th night: Component Interop 🕯🕯🕯🕯🕯🕯🕯🕯

You don't need to use only #lit components in your #lit app

Mix old-school #Polymer 3 components with #vue js web components. Put #stencil
js Microsoft's #FAST UI on the same page

It's your party!

```html
<!DOCTYPE html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.61/dist/themes/light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"/>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.61/dist/shoelace.js"></script>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"></script>
  <script type="module" src="https://unpkg.com/@microsoft/fast-components"></script>
  <script type="module" src="https://unpkg.com/@patternfly/pfe-datetime@1.12.2/dist/pfe-datetime.js?module"></script>
  <script type="module" src="https://unpkg.com/@material/mwc-button?module"></script>
</head>
<body>
  <sl-card>
    <pfe-datetime slot="header" type="relative" datetime="Mon Jan 2 15:04:05 EST 2010"></pfe-datetime>
    <ion-img slot="image" src="https://placekitten.com/300/200"></ion-img>
    <fast-progress-ring min="0" max="100" value="75"></fast-progress-ring>
    <mwc-button slot="footer">More Info</mwc-button>
  </sl-card>
</body>
```

