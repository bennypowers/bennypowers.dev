---
title: Any Framework, One Stripe Integration
description: Stripe Elements custom elements work across front-end frameworks and even in vanilla HTML and JS.
published: true
tags:
  - web components
  - html
  - javascript
---

# It's Release Day!! 🎉

![A happy hedgehog](https://media.giphy.com/media/2tSTqVTVHbCy35ybwk/giphy.gif)

Take a <abbr title="peek">👀</abbr> at
[`@power-elements/stripe-elements`][npm-package], a package which exposes the
[Stripe.js](https://stripe.com/docs/js) API through cross-framework,
declarative custom elements.

What that means is that with the help of `<stripe-elements>`, you can easily
integrate Stripe credit card payments into your site, no matter which framework
you're using - if any! Even if your payment form is inside Shadow DOM (not yet
officially supported by Stripe.js), you can still take payments securely with
these custom elements.

And this [latest version][changelog] adds a nice new feature. Introducing:
`<stripe-payment-request>`

## Demo

<iframe src="https://codesandbox.io/embed/stripe-web-component-vanilla-ztuvg"
        style="width:100%;height:calc(300px + 8vw); border:0; border-radius: 4px; overflow:hidden;"
        allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
        loading="lazy"
        sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

The above demo will try to use `<stripe-payment-request>` for a nicer UX, but
if the browser is unable, will fall back to a classic `<stripe-elements>`
credit card form.

If you want to check out the Payment Request support, you'll need
- A browser which supports the [Payment Request API][payment-request] (or Apple
  Pay for Safari)
- At least one credit card saved in the browser (i.e. test card
  `4242424242424242`)
- You need a Stripe testing publishable key

To use the fallback form, all you need is the publishable key.

And like I mentioned above, [stripe-elements web components work with any
framework][framework-demos].

## For More Info...

For complete API documentation see the [README][README], and for live demos of
various use cases, check out the [demo][demo].

Take it for a spin in your next project:

```
npm i -S @power-elements/stripe-elements
```

```html
<script type="module" src="https://unpkg.com/@power-elements/stripe-elements?module"></script>
```

[npm-package]: https://npm.im/@power-elements/stripe-elements
[changelog]: https://github.com/bennypowers/stripe-elements/blob/master/CHANGELOG.md
[payment-request]: https://caniuse.com/#feat=payment-request
[framework-demos]: https://bennypowers.dev/stripe-elements/?path=/docs/framework-examples-angular--stripe-elements
[README]: https://github.com/bennypowers/stripe-elements/blob/master/README.md
[demo]: https://bennypowers.dev/stripe-elements/?path=/docs/elements-stripe-elements--enter-a-publishable-key
