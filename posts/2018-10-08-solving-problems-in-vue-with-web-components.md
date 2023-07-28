---
title: Solving Problems in Vue with Web Components
description: You don't need to give up your frameworks to use web components. You can use them anywhere you can use HTML and JavaScript.
published: true
coverImage: https://thepracticaldev.s3.amazonaws.com/i/xao0cp7ku9ljs5g4sp8p.png
tags:
  - web components
  - vue
  - javascript
  - interop
---

This is a bonus post in a series I'm working covering web components.

1. [Part 1: The Standards](../lets-build-web-components/part-1-the-standards/)
1. [Part 2: The Polyfills](../lets-build-web-components/part-2-the-polyfills/)
1. [Part 3: Vanilla Components](../lets-build-web-components/part-3-vanilla-components/)

Part 4, on the Polymer library, is on the way. While we're waiting, check out
this neat problem a student approached me with that we can solve with web
standards:

They were using a library to render a WebGL globe inside a Vue component. They
wanted to generate a set of markers and then track which markers were opened
and which were closed. The WebGL library provided some APIs for attaching a
string of `innerHTML` to each marker's popup, but didn't expose any APIs to
track open, close, or click events.

I had a bit of a devilish thought 😈. If we can't add behaviour to the library
popups, but we can add HTML, what if we added HTML that encapsulates its own
behaviour?

**🎩 Web Components to the Rescue!! 👨‍💻**

## Defining `<popup-tooltip>`

What we needed was an HTML element that fires an event every time it's
containing popup opens or closes. The WebGL lib used `style="visibility:
visible"` to open and close popups, so we'll create an element that uses
`MutationObserver` to observe it's own parents.

```js
class PopupTooltip extends HTMLElement {
  constructor() {
    super();
    this.observerCallback = this.observerCallback.bind(this);
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(document.createElement('slot'));
    this.observer = new MutationObserver(this.observerCallback);
  }

  connectedCallback() {
    // HACK: WebGL library toggles style.visibility on it's own
    // generated DOM to hide and show tooltips.
    const libraryContainer = this.parentElement.parentElement.parentElement;
    const config = { attributes: true, subtree: false, children: false };
    this.observer.observe(libraryContainer, config);
  }

  observerCallback([{target}]) {
    const visible = target.style.visibility === 'visible';
    const type = 'popup-' + visible ? 'opened' : 'closed';
    const bubbles = true;
    const composed = true;
    const detail = this;
    this.dispatchEvent(new CustomEvent(type, { bubbles, composed, detail }));
  }
}

customElements.define('popup-tooltip', PopupTooltip);
```

## Connecting to the Vue Wrapper

So now we have a `<popup-tooltip>` element which will fire a `popup-opened` or
`popup-closed` event any time it's container's visibility is toggled by the
WebGL library. We set up listener's in the private DOM of the wrapping Vue
Component:

```html
<!-- WebGL lib instanciates on '#earth' -->
<div id="earth" @popup-opened="onPopupOpened" @popup-closed="onPopupClosed"></div>
```

## Creating Each Popup

Then when we instantiated the WebGL lib and passed our data, we set up the
markers to display a `<popup-tooltip>` element in it's tooltip content.

```js
geoMarkers.forEach(marker => {
  const location = marker.latLng;
  const glMarker = new WebGLLib.popup({/*...*/});
  // NB: popupHTML is **just HTML**, there's no framework or library here.
  const popupHTML = `<popup-tooltip data-location="${location}">${marker.title}</popup-tooltip>`;
  // `bindPopup` is a method on our WebGL library's marker API.
  glMarker.bindPopup(popupHTML, config);
})
```

## Profit!

The last thing we had to do was track which popups were opened and which
closed.

```js
onPopupOpened({target: {dataset: {location}}}) {
  const [lat, lng] = location.split(',');
  console.log(`opened: lat: ${lat} lng: ${lng}`);
}
```

You don't need to give up your frameworks to use web components. You can use
them anywhere you can use HTML and JavaScript. That's precisely what made
web-components a win here: our GL library didn't take Vue components as input,
it took a string of HTML.

See you in a few days for part 4 on the Polymer library.

Would you like a one-on-one mentoring session on any of the topics covered
here? [![Contact me on
Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

