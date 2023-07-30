---
title: Another way React Breaks HTML
published: true
audience: react stans
tldr: |
  Unsuspecting #react users may come to believe that #WebComponents break
  react, but the truth is - as usual - exactly the opposite. Despite the
  superficial similarity to #HTML, react's JSX language breaks the web
  platform's powerful native slot element.
coverImage: /assets/images/sad-react.png
coverImageAlt: shocked, sad, scared react logo
tags:
  - javascript
  - react
  - html
templateEngineOverride: webc,md
---

React users who are unaware of the limitations of react and JSX may be confused 
when putting react components inside web component (i.e. slotting them in). 
Despite their superficial similarities and the popular perception, react 
components are not HTML elements and JSX isn't HTML. Because of that, React 
components which fail to forward their props to their containing element 
(specifically the `slot` prop, which in most cases react should coerce to the 
`slot` attribute) will not project into the correct native slot. Those elements
will project into the default slot if it exists, and disappear if it does not.

Let's write a little demo to illustrate the problem. This demo will use a custom
element called [`<pf-card>`][pf-card] from the [`@patternfly/elements`][pfe] 
package, which has three slots - `header` for headings and such, the default
slot for body content, and `footer` for action buttons and the like. To clarify 
the issue, we'll set red, green, and blue background colours on our card's slot 
regions, respectfully. 

```css
#card::part(header) { background-color: #f008; }
#card::part(body)   { background-color: #0f08; }
#card::part(footer) { background-color: #00f8; }
```

Now let's write two react components, one which forwards its slot prop, and 
one which does not. We'll write an "App" component which sets our examples as 
children of a card, in each of the three slots. We'll have our examples print out which slot they are meant to be projected into, and sandwich them with DOM nodes, so that we'll be able to tell right away which react components are rendering out of place.

<template webc:raw webc:nokeep>

```jsx
import { Card } from "@patternfly/elements/react/pf-card/pf-card.js";

const printSlots = ({ slot }) => slot
  ? (<code>slot="{slot}"</code>)
  : (<span>Default slot</span>);

function ForwardsSlot(props) {
  return (
    <div slot={props?.slot}>
      <p>{printSlots(props)} <strong>forwarded</strong>.</p>
    </div>
  );
}

function NoForwardsSlot(props) {
  return (
    <div>
      <p>{printSlots(props)} <strong>not</strong> forwarded.</p>
    </div>
  );
}

function App() {
  return (
    <Card id="card" className="App" rounded>
      <small slot="header">Header content starts</small>
      <ForwardsSlot slot="header" />
      <NoForwardsSlot slot="header" />
      <small slot="header">Header content ends</small>

      <small>Body content starts</small>
      <ForwardsSlot />
      <NoForwardsSlot />
      <small>Body content ends</small>

      <small slot="footer">Footer content starts</small>
      <ForwardsSlot slot="footer" />
      <NoForwardsSlot slot="footer" />
      <small slot="footer">Footer content ends</small>
    </Card>
  );
}

export default App;
```

</template>

If this was HTML, it would Just Work™: we should see our components' content projected into
the slots specified with the `slot` attribute, two in the head, two in the body, and two in the first. But this is not HTML, iTs jUSt 
jAVasCriPt, *bruh*, so it should cOmPOse beTteR, right?

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);border-radius:2px;"
        width="800"
        height="450"
        src="https://codesandbox.io/p/sandbox/react-breaks-native-html-slot-wkhygs?file=%2Fsrc%2FApp.tsx%3A11%2C37&embed=1"
        allowfullscreen></iframe>

Not so much. Instead, the subtle bug in react's virtual DOM abstraction has our non-forwarding components rendering into the default slot of the card. If there was no default slot, they would disappear.

So what can web developers stuck in react codebases do? In cases 
where the user is able to control the slotted react component, they should be 
sure to forward the `slot` prop to the container. Otherwise, they must wrap the 
react component in a DOM node and place the `slot` attribute on the wrapper.

<template webc:raw webc:nokeep>

```jsx
function App() {
  return (
    <Card id="card" className="App" rounded>
      <div slot="header" style="display:contents;">
        <NoForwardsSlot />
      </div>
    </Card>
  );
}
```

</template>

<aside>
  Remember: proper diet and exercise will go a long way to alleviating 
  the stress.
</aside>

It's often said how react improves the developer experience, but this right here 
is just another example of how React breaks web development, the web platform, 
and ultimately web developers' understanding of the medium in which they work.

<div>
<fed-embed post-url="https://hachyderm.io/@collinsworth/110799881063292165"/>
</div>

If you're still using React, and wondering why web development is so
complicated, take Josh' words to heart.

[pf-card]: https://patternflyelements.org/components/card
[pfe]: https://patternflyelements.org
