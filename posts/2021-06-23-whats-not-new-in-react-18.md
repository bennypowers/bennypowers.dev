---
title: What's Not new in React 18
published: true
tldr: >-
  The react team could have implemented HTML support in React 18, they could
  have even let others do it for them, but they didn't. It's time to reconsider
  a web framework which is at best negligent and at worst actively hostile to
  web standards.
tags:
  - javascript
  - react
  - web components
  - opinion
---
After so much hype,

After so much excitement,

After so many buzzwords,

After months and years of waiting for the next React major...

<center>

**It landed**

</center>

![Cupid's foot landing (from Monty Python)](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cpg8jzdr4u4xlubq2u70.jpg)

And congrats to React for delivering some much ballyhoo'd features...

...But what they did _not_ deliver was HTML support.

For [five years now](https://github.com/facebook/react/issues/11347), there's
been a [concerted](https://github.com/facebook/react/issues/4751), multilateral
push to [bring React into line](custom-elements-everywhere.com/#react) with
[every](https://custom-elements-everywhere.com/#angular)
[other](https://custom-elements-everywhere.com/#vue)
[major](https://custom-elements-everywhere.com/#svelte)
[framework](https://custom-elements-everywhere.com/#preact) on custom elements,
enshrined in the HTML and DOM specs for years now. Much effort was spent both
in public and behind the scenes to encourage the React core team to implement
real support for the standards.

But then the PRs were closed, or ignored without public comment. And the issues
languished. And the hopeful indications of a willingness to play ball with the
rest of the web community grew stale and limp. 

We, developers that want to write components that work in any frontend stack,
were really hopeful that React _17_ would deliver, but React is still the
Safari iOS of front-end frameworks.

What's not new in React 18? What will probably not be new in React 19? A
serious commitment to first-class support for the full range of the HTML and
DOM specifications. It's not like the React engineers don't know how to do
this. Preact's had it for years, and at smaller bundle sizes with better
runtime performance, yet. No one wants to take away your functional API or your
fantastic ecosystem, we can have it all while still playing nice with the
broader industry.

<a href="#facebook-can-do-this">Skip code sample comparison</a>

```js
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import '@apollo-elements/components/apollo-client';
import '@apollo-elements-demos/spacex-launches';

export const LaunchesDemo = ({ limit = 10 }) => {
  const [{ missionName, id }, setSelectedLaunch] = useState({});
  const [launches, setLaunches] = useState([]);
  return (
    <Fragment>
      <apollo-client uri="https://api.spacex.land/graphql">
        <spacex-launches
            limit={limit}
            onselected-launch-changed={({ detail }) => setSelectedLaunch(detail)}
            onlaunches-changed={({ detail }) => setLaunches(detail)}
        ></spacex-launches>
        <p>From {launches.length} launches, you selected {missionName || 'nothing'}.</p>
      </apollo-client>
    </Fragment>
  );
};
```

<figure>
  <figcaption>Preact: Just Works</figcaption>
</figure>


```js
import React, { createRef, useState, useEffect } from "react";
import '@apollo-elements/components/apollo-client';
import "@apollo-elements-demos/spacex-launches";

export const LaunchesDemo = ({ limit }) => {
  const launchesRef = createRef(null);
  const launchRef = createRef(null);
  const [{ missionName, id }, setSelectedLaunch] = useState({});
  const [launches, setLaunches] = useState([]);

  useEffect(() => {
    launchesRef.current.addEventListener("launches-changed", ({ detail }) => setLaunches(detail));
    launchesRef.current.addEventListener("selected-launch-changed", ({ detail }) => setSelectedLaunch(detail));
  }, [launchesRef.current]);

  useEffect(() => {
    launchesRef.current.limit = limit;
  }, [limit]);
  
  return (
    <React.Fragment>
      <apollo-client uri="https://api.spacex.land/graphql">
        <spacex-launches ref={launchesRef}></spacex-launches>
        <p>From {launches.length} launches, you selected {missionName || "nothing"}.</p>
      </apollo-client>
    </React.Fragment>
  );
};
```

<figure>
  <figcaption>React: y, tho?</figcaption>
</figure>

## Facebook can do this

Facebook's engineers are world-class; surely they have the skills to support
the DOM standard. Enough of the excuses, come and [join us at the
table](https://www.w3.org/community/webcomponents/). Facebook _can_ do this.
But do they _want_ to do it?

The broader open web community has, for their part, bent over backwards to pick
up the React team's slack; writing
[workaround](https://github.com/tomivirkki/react-vaadin-components), after
[hack](https://github.com/SAP/ui5-webcomponents-react), after
[bodge](https://www.npmjs.com/package/@lit-labs/react). The rest of the web has
cut their losses, it seems. A shame for all of us, but especially for React
users.

## The Future of the Web

For the seemingly overwhelming crush of developers and recruiters who have
convinced themselves that React and VDOM is The One True Component Model™️, I'm
deeply concerned that the [cruft](https://www.wikiwand.com/en/Cruft) crisis
will hit your shores sooner than you think. I can still point to startups
struggling with their legacy angularjs codebases, unable to move forward, and
lacking the resources or will for The Big Rewrite.

Compare that to web standards: HTML is 28 years old and still hasn't ever
broken backwards. At the risk of invoking a meme, go load up the [Space Jam
homepage from 1996](https://www.spacejam.com/1996/) in your evergreen browser
and bask in the glory of `<table>` layouts and image maps, still happily
running three decades hence.

HTML and the DOM are the bedrock foundations of the web. They're critical,
non-negotiable, and even if not perfect (they aren't), they're not going
anywhere. We, as web developers of all stripes, committed to any framework or
none, should rally together to fight the real struggle: protecting and
nurturing the open web that gave us our livelihoods, to keep it relevant and
vibrant into the next decades.

[Meanwhile](https://arewebcomponentsathingyet.com/), on the [actual
web](https://www.chromestatus.com/metrics/feature/timeline/popularity/1689),
web components adoption is spreading like wildfire. Developers, don't get left
behind! Build that design system using a web component base class or a
functional web component library, and export React components automatically
with [one of](https://github.com/BBKolton/reactify-wc#readme) the [reactify-ing
workarounds](https://www.npmjs.com/package/@lit-labs/react). Your users across
all frameworks will thank you, and you'll be glad you did when it comes time to
handle the next big hype cycle.

We can't wait to welcome React back into the fold, but increasingly we've been
asking ourselves if they even want to be there with us. My biggest hope in
writing this is to be proven wrong by a meaningful commitment from Facebook.
