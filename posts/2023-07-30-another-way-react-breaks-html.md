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

<style>
  iframe {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius:2px;
    max-width:100%;
  }
  #slots-diagram svg {
    color: inherit;
  }
</style>

React users who are unaware of the limitations of react and JSX may be confused 
when putting react components inside web component (i.e. slotting them in). 
Despite their superficial similarities and the popular perception, react 
components are not HTML elements and JSX isn't HTML. Because of that, React 
components which fail to forward their props to their containing element 
(specifically the `slot` prop, which in most cases react should coerce to the 
`slot` attribute) will not project into the correct native slot. Those elements
will project into the default slot if it exists, and disappear if it does not.

## What are Native Slots?

<details open webc:raw><summary>Skip this section</summary>

Before we elaborate on the problem and introduce the workarounds, it's worth 
explaining what `<slot>` does. The web browser you are reading this post with
comes pre-compiled with it's own built-in component model, called web
components. Web components are custom HTML elements. The primary way for those 
components to define their boundaries is with the Shadow DOM, which is a 
private, visible, parallel DOM structure attached to the element. When creating
web components, we can write `<slot>` elements into their shadow DOM which
instruct the browser where to project the custom element's children. Those
projected children continue to exist in the normal document (often called the 
"light DOM", in distinction to the shadow DOM), but they appear visually in the
place where their assigning slot element is in the shadow DOM, and can be styled
by shadow CSS.

<figure id="slots-diagram">
  <svg xmlns:xlink="http://www.w3.org/1999/xlink"
       viewBox="0 0 211.667 158.75"
       xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .f-r { fill: #f00; }
        .f-g { fill: var(--g, #0c0); }
        .f-b { fill: var(--b, #00f); }
        .s-r { stroke: #f00; }
        .s-g { stroke: var(--g, #0c0); }
        .s-b { stroke: var(--b, #00f); }
        @media (prefers-color-scheme: dark) {
          #slots-diagram-group {
            --b: #55f;
            --g: #0f0;
          }
        }
      </style>
      <marker id="e"
              markerHeight="1"
              markerWidth="1"
              orient="auto-start-reverse"
              overflow="visible"
              preserveAspectRatio="xMidYMid" 
              refX="0"
              refY="0"
              viewBox="0 0 1 1">
        <path fill="context-stroke"
              fill-rule="evenodd"
              d="M-1.4-2.8 6.3 0l-7.7 2.8C0 1.169 0-1.162-1.4-2.8z"/>
      </marker>
        <path id="d" d="M39.338 94.987h376.8v383.897h-376.8z"/>
      </defs>
      <g id="slots-diagram-group">
        <g stroke="currentColor"
           clip-path="url(#b)"
           transform="translate(86.593 -.219)">
          <rect width="88.344" height="112.846" x="23.495" y="20.068" fill="#f9f9f9" stroke="currentColor" stroke-dasharray="none" stroke-linecap="round" stroke-opacity="1" stroke-width="1" rx="0" ry="0"/>
          <rect width="88.344" height="24.28" x="23.495" y="20.068" class="f-r" fill-opacity=".533" stroke="none" rx="0" ry="0"/>
          <rect width="88.344" height="64.287" x="23.495" y="44.347" class="f-g" fill-opacity=".533" stroke="none" rx="0" ry="0"/>
          <rect width="88.344" height="24.28" x="23.495" y="108.634" class="f-b" fill-opacity=".533" stroke="none" rx="0" ry="0"/>
        </g>
        <text xml:space="preserve"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="0"
              font-family="Alef"
              font-size="24"
              style="white-space:pre;shape-inside:url(#d)"
              transform="translate(-2.526 31.584) scale(.26458)"><tspan x="39.338" y="117.184"><tspan fill="currentColor"><tspan><</tspan>pf-card<tspan>></tspan>
</tspan></tspan><tspan x="39.338" y="147.184"><tspan fill="currentColor">  <tspan><</tspan></tspan><tspan class="f-g">p</tspan><tspan fill="currentColor"><tspan>></tspan>...<<tspan>/</tspan></tspan><tspan class="f-g">p</tspan><tspan fill="currentColor"><tspan>></tspan>
</tspan></tspan><tspan x="39.338" y="177.184"><tspan fill="currentColor">  <tspan><</tspan>h2 slot=</tspan><tspan class="f-r">header</tspan><tspan fill="currentColor"><tspan>></tspan>...<tspan><</tspan>/h2<tspan>></tspan>
</tspan></tspan><tspan x="39.338" y="207.184"><tspan fill="currentColor">  <tspan><</tspan>button slot=</tspan><tspan class="f-b">footer</tspan><tspan fill="currentColor"><tspan>></tspan>...<tspan><</tspan>/button<tspan>></tspan>
</tspan></tspan><tspan x="39.338" y="237.184"><tspan fill="currentColor"><tspan><</tspan>/pf-card<tspan>></tspan></tspan></tspan></text>
        <path fill="none" class="s-g" stroke-linecap="round" stroke-width="2" marker-end="url(#e)" d="M39.588 65.037s32.219-29.437 59.54-3.111"/>
        <path fill="none" class="s-r" stroke-linecap="round" stroke-width="2" marker-end="url(#e)" d="M44.146 70.264S61.44 30.798 97.894 34.948"/>
        <path fill="none" class="s-b" stroke-linecap="round" stroke-width="2" marker-end="url(#e)" d="M53.81 91.366s3.715 25.04 40.168 29.19"/>
      </g>
    </svg>
    <figcaption>
      Diagram showing how slotted content projects into the shadow DOM. A 
      paragraph (in green), without a slot attribute, projects into the default 
      slot in the center of the card. An h2, in red and with the slot=header 
      attribute, projects into the red header area. A button, in blue and with 
      the slot=footer attribute, slots into the blue footer region. 
    </figcaption>
  </figure>
</details>

## Demonstration

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

Now let's write two react components, one called `ForwardsSlot` which forwards 
its slot prop, and one called `NoForwardsSlot` which does not. We'll have both 
of these components print out which slot they are meant to be projected into. 
Then, we'll write an "App" component which sets our examples as children of a 
card, in each of the card's three slots  and sandwich them with DOM nodes, so 
that we'll be able to tell right away which react components are rendering out 
of place.

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

export default function App() {
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
```

</template>

According to the source props, we expect to see our components' content projected 
into the slots specified with the `slot` attribute, two in the head, two in the 
body, and two in the footer. If this was HTML, it would Just Work™. But this is 
not HTML, iTs jUSt jAVasCriPt, so it should cOmPOse beTteR, *bruh*. Will we see 
our content in order?

<iframe src="https://codesandbox.io/p/sandbox/react-breaks-native-html-slot-wkhygs?file=%2Fsrc%2FApp.tsx%3A11%2C37&embed=1"
        width="800"
        height="450"
        allowfullscreen></iframe>

Not so much. Instead, the subtle bug in react's virtual DOM abstraction has our 
non-forwarding components rendering into the default slot of the card. If there 
was no default slot, they would disappear.

## Workarounds

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

## Why Keep Digging?

It's often said how react improves the developer experience, but this right here 
is just another example of how React breaks web development, the web platform, 
and ultimately web developers' understanding of the medium in which they work.

<div><fed-embed post-url="https://hachyderm.io/@collinsworth/110799881063292165"/></div>

If you're still using React, and wondering why web development is so
complicated, take Josh' words to heart.

[pf-card]: https://patternflyelements.org/components/card
[pfe]: https://patternflyelements.org
