---
title: Microcopy Translations as a Reactive Controller
published: false
description: Adding i18n with a little Platform-centric JavaScript and Reactive Controllers
datePublished: 2023-02-19
tags:
  - javascript
  - typescript
  - lit
---

The inimitable Nikki Massaro Kaufman has been working on the upcoming Red Hat 
audio player web component. It's an impressive piece of work that packs a tonne 
of features into such a small package. We got an order to implement client-side 
translations, so Nikki opted for an approach that lazy-loads key-value pairs 
into the app.

Initially, this was set up as a <abbr title="plain old javascript 
object">POJO</abbr>, but that had a couple of drawbacks

1. We needed to use bracket access, or wrap that up in a dedicated private 
instance method
    ```ts
    #translate(key: string) {
      return this.#microcopy[key] ?? key;
    }
    ```
2. Whenever modifying the table (e.g. when lazy loading) we had to rememeber to 
sprinkle in `this.requestUpdate()` to make sure to rerender

Squinting, I started to see the outline of reactive controller with one eye and 
a Map with the other. Problem is maps don't have default getters.

Turns out the modern web platform is a joy to work with:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class MicrocopyController extends Map<string, string> implements ReactiveController {
  hostConnected?(): void
}
```

For ergonomics, let's accept a POJO:

```ts
constructor(private host: ReactiveControllerHost, obj: Record<string, string>) {
  super(Object.entries(obj));
}
```

Then we'll implement our default getter:

```ts
get(key: string) {
  return super.get(key) ?? key;
}

```

Since the strings are lazy loaded, and the lang can change as a result of user 
input, we can round it out with some built-in reactivity:

```ts
set(key: string, value: string) {
  super.set(key, value);
  this.host.requestUpdate();
  return this;
}

clear() {
  super.clear();
  this.host.requestUpdate();
}

delete(key: string) {
  const r = super.delete(key);
  this.host.requestUpdate();
  return r;
}
```

For the lulz, let's add a `join` method that lets us fold in new definitions: 

```ts
join(obj: Record<string, string>) {
  for (const [key, value] of Object.entries(obj)) {
    this.set(key, value);
  }
  this.host.requestUpdate();
  return this;
}
```

_et voila_, we're done!

Use it like this:

```ts
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MicrocopyController } from './microcopy-controller.js';

const LANGS = {
  'en-us': {
    hello: 'Hello'
  },
  'he-il': {
    hello: 'שלום',
  }
};

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  static styles = css`p { color: blue }`;

  #i18n = new MicrocopyController(this, LANGS['en-us']);

  @property() name = 'Somebody';

  @property() lang = 'en-us';

  willUpdate(changed) {
    if (changed.has('lang'))
      this.#i18n.join(LANGS[this.lang]);
  }

  render() {
    return html`
        <form @change=${e => this.lang = e.target.elements.lang.value}>
          <label>English<input type="radio" name="lang" value="en-us"></label>
          <label>Hebrew<input type="radio" name="lang" value="he-il"></label>
        </form>
        <p>${this.#i18n.get('hello')}, ${this.name}!</p>
    `;
  }
}

```

[playground](https://lit.dev/playground/#project=W3sibmFtZSI6InNpbXBsZS1ncmVldGluZy50cyIsImNvbnRlbnQiOiJpbXBvcnQge2h0bWwsIGNzcywgTGl0RWxlbWVudH0gZnJvbSAnbGl0JztcbmltcG9ydCB7Y3VzdG9tRWxlbWVudCwgcHJvcGVydHl9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcbmltcG9ydCB7IE1pY3JvY29weUNvbnRyb2xsZXIgfSBmcm9tICcuL21pY3JvY29weS1jb250cm9sbGVyLmpzJztcblxuY29uc3QgTEFOR1MgPSB7XG4gICdlbi11cyc6IHtcbiAgICBoZWxsbzogJ0hlbGxvJ1xuICB9LFxuICAnaGUtaWwnOiB7XG4gICAgaGVsbG86ICfXqdec15XXnScsXG4gIH1cbn07XG5cbkBjdXN0b21FbGVtZW50KCdzaW1wbGUtZ3JlZXRpbmcnKVxuZXhwb3J0IGNsYXNzIFNpbXBsZUdyZWV0aW5nIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIHN0YXRpYyBzdHlsZXMgPSBjc3NgcCB7IGNvbG9yOiBibHVlIH1gO1xuXG4gICNpMThuID0gbmV3IE1pY3JvY29weUNvbnRyb2xsZXIodGhpcywgTEFOR1NbJ2VuLXVzJ10pO1xuXG4gIEBwcm9wZXJ0eSgpIG5hbWUgPSAnU29tZWJvZHknO1xuXG4gIEBwcm9wZXJ0eSgpIGxhbmcgPSAnZW4tdXMnO1xuXG4gIHdpbGxVcGRhdGUoY2hhbmdlZCkge1xuICAgIGlmIChjaGFuZ2VkLmhhcygnbGFuZycpKVxuICAgICAgdGhpcy4jaTE4bi5qb2luKExBTkdTW3RoaXMubGFuZ10pO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBodG1sYFxuICAgICAgICA8Zm9ybSBAY2hhbmdlPSR7ZSA9PiB0aGlzLmxhbmcgPSBlLnRhcmdldC5lbGVtZW50cy5sYW5nLnZhbHVlfT5cbiAgICAgICAgICA8bGFiZWw-RW5nbGlzaDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwibGFuZ1wiIHZhbHVlPVwiZW4tdXNcIj48L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbD5IZWJyZXc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cImxhbmdcIiB2YWx1ZT1cImhlLWlsXCI-PC9sYWJlbD5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgICA8cD4ke3RoaXMuI2kxOG4uZ2V0KCdoZWxsbycpfSwgJHt0aGlzLm5hbWV9ITwvcD5cbiAgICBgO1xuICB9XG59XG4ifSx7Im5hbWUiOiJpbmRleC5odG1sIiwiY29udGVudCI6IjwhRE9DVFlQRSBodG1sPlxuPGhlYWQ-XG4gIDxzY3JpcHQgdHlwZT1cIm1vZHVsZVwiIHNyYz1cIi4vc2ltcGxlLWdyZWV0aW5nLmpzXCI-PC9zY3JpcHQ-XG48L2hlYWQ-XG48Ym9keT5cbiAgPHNpbXBsZS1ncmVldGluZyBuYW1lPVwiV29ybGRcIj48L3NpbXBsZS1ncmVldGluZz5cbjwvYm9keT5cbiJ9LHsibmFtZSI6InBhY2thZ2UuanNvbiIsImNvbnRlbnQiOiJ7XG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImxpdFwiOiBcIl4yLjAuMFwiLFxuICAgIFwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50XCI6IFwiXjEuMC4wXCIsXG4gICAgXCJsaXQtZWxlbWVudFwiOiBcIl4zLjAuMFwiLFxuICAgIFwibGl0LWh0bWxcIjogXCJeMi4wLjBcIlxuICB9XG59IiwiaGlkZGVuIjp0cnVlfSx7Im5hbWUiOiJtaWNyb2NvcHktY29udHJvbGxlci50cyIsImNvbnRlbnQiOiJpbXBvcnQgdHlwZSB7IFJlYWN0aXZlQ29udHJvbGxlciwgUmVhY3RpdmVDb250cm9sbGVySG9zdCB9IGZyb20gJ2xpdCc7XG5cbmV4cG9ydCBjbGFzcyBNaWNyb2NvcHlDb250cm9sbGVyIGV4dGVuZHMgTWFwPHN0cmluZywgc3RyaW5nPiBpbXBsZW1lbnRzIFJlYWN0aXZlQ29udHJvbGxlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaG9zdDogUmVhY3RpdmVDb250cm9sbGVySG9zdCwgb2JqOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc-KSB7XG4gICAgc3VwZXIoT2JqZWN0LmVudHJpZXMob2JqKSk7XG4gIH1cblxuICBnZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0KGtleSkgPz8ga2V5O1xuICB9XG5cbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgc3VwZXIuc2V0KGtleSwgdmFsdWUpO1xuICAgIHRoaXMuaG9zdC5yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBzdXBlci5jbGVhcigpO1xuICAgIHRoaXMuaG9zdC5yZXF1ZXN0VXBkYXRlKCk7XG4gIH1cblxuICBkZWxldGUoa2V5OiBzdHJpbmcpIHtcbiAgICBjb25zdCByID0gc3VwZXIuZGVsZXRlKGtleSk7XG4gICAgdGhpcy5ob3N0LnJlcXVlc3RVcGRhdGUoKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuXG4gIGpvaW4ob2JqOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc-KSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMob2JqKSkge1xuICAgICAgdGhpcy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIHRoaXMuaG9zdC5yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBob3N0Q29ubmVjdGVkPygpOiB2b2lkXG59XG4ifV0)
