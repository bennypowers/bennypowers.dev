---
title: Your Design System is Not a Solution
published: true
tags:
  - design systems
  - web components
audience: Team leaders, design system engineers, product managers, web developers
tldr: >-
  Design systems are tools, not solutions. They're not there to solve every
  problem for every team, but rather to put quality tools in the hands of
  skilled craftsmen.
coverImageAlt: Crop male master shaping wooden stick with spokeshave in workshop. Photo by Ono Kosuki
coverImage: /assets/images/ono-kosuki-craftsman.jpg
---

You've got a problem. Your painting fell, and you want to hang it back up.
You grab a hammer and some nails, you get to swinging, you make a few
adjustments, and *Hey Presto!* before you know it, your problem is solved.

You have implemented a **solution**: you hung the painting.

Just then, your neighbour knocks on the door. Wouldn't you know it? he *also*
has a problem. *His* painting has fallen, too. He *also* needs a solution. Being 
the magnanimous, good-looking, and preturnaturally charming neighbour that you 
are, you leap into motion, practically stuffing his arms with hammer and nails, 
and you send him on his way, richly satisfied by your own generosity.

An hour later, he knocks again. You see — your house is built of timber and
drywall, while your neighbour's house is built of cinderblocks and plaster. Your
neighbour now has two problems — his painting is still on the floor, *and* he 
now has an unsightly hole in the wall.

## Tools, or Solutions

Now, your solution needed a bunch of tools to get 'er done:

- the hammer
- the nails
- maybe a level or a tape measure
- your skill at swinging the hammer
- barring that, a bag of frozen peas
- the impeccable taste of your living companions

Some of those tools were essential to the solution, others less so. But they
all have one thing in common:

*none of those tools is the solution to your problem*.

If you really needed to, you could probably hang that painting with an old shoe

Consider, too, that your solution didn't work for your neighbour, who built with 
cinderblocks and plaster, and actually made things worse for him. What went 
wrong? Was it the tools you gave him? Not necessarily. He might have used the 
hammer you gave him to drive special cinderblock nails or those plastic-and-tack 
plaster hooks.

The problem wasn't the tools — *the problem was seeing the tools as the 
solution*.

Jackhammers require care in use. Thumbtacks are cheap, plentiful, and not 
particularly dangerous. Both are needed on a construction site — one to break 
large blocks of concrete and rock, one to hang plans and blueprints. Both tools 
are important — crucial even - in their own ways, but they have widely different 
costs, lifespans, and restrictions on their use.

## *Cui Bono*?

If you've been following along, you're probably waiting for the punchline,
so here it is:

> Your design system is not a solution, it's a *toolkit*

So why do companies adopt design systems? Are they just spinning their wheels?
Well, my desire to continue receiving a steady paycheque requires me to say, "No, 
they aren't! Design systems really do solve problems for companies!" But there's
an important difference between the kind of problem which design systems solve
and *your team*'s design problem.

Companies adopt design systems because they want:

- a "single source of truth"
- consistent visual style across large teams
- consistent standards of accessibility
- UX/UI recommendations lovingly crafted by specialists

All of these are fancy ways of saying they want to establish and enforce
rules and guidelines for producing user interfaces. Design systems help solve 
that problem by centralizing the know-how for building the components of those 
interfaces in a way which can be easily ported to different teams'
workflows.

## Mowing the Neighbour's Lawn

Design systems can't and shouldn't try to solve every problem for every team. 
This industry is by its nature prone to widely varied opinions and approaches, 
one often incompatible with the other, and establishing a baseline is hard 
enough without shipping bespoke implementations for each team that comes along.
The reasons for this become immediately clear once you shift perspective from 
that of the product maintainer to that of the design system maintainer.

The specialist skills needed to produce a design system are not the same as 
those needed to ship products. Product teams often need to move quickly to ship
new features, built on top of the previous framework, and they often don't have
the luxury of The Big Rewrite™.

From the design system maintainer's point of view, the customer is actually the
product owner/developer. That's not to excuse design systems from concerning 
themselves with end users — quite the opposite. But rather, as toolmakers, 
their primary responsibility is to produce quality tools for their fellow 
craftsmen.

> If you don't own the problem, you can't own the solution

Since different projects have different toolchains, histories, and processes,
they have different constraints as well. What appears to be a non-starter to one
maintainer is a no-brainer to another. Because of this, design system engineers
would do well to focus their effort on [platforms][platforms] rather than
[frameworks][frameworks].

## Tech Debt up to Here

So, your design system is now free to build on top of platform primitives, and
there are greenfield projects and high-velocity teams reaping the benefits of 
platform-oriented development. *Lechaim* — 🥃 Fancy bourbon all around! But that 
still doesn't solve the problem of legacy framework integration. Who's left 
holding the bag?

Some organizations solve this by reimplementing their design system for every 
framework that comes along. To my taste, this practice is error-prone; remember 
our initial goals from above. Web development is complex enough when targeting 
the browser: duplicating that effort across multiple frameworks scales that 
complexity geometrically. It also requires more resources, effort, attention, 
and time.

Moreover, tracking integration problems inside the design system repositories
can lead to an awkward situation where greenfield users might mistakenly adopt
the workarounds and second-bests in place of the happy path. There are costs to 
increasing API surface, and teams responsible for shipping tools to diverse
projects shouldn't be burdened with the maintenance of those workarounds, when
they have other customers who don't need — and shouldn't try - to adopt them.

Design systems that rest on platform features like custom elements, shadow DOM,
import maps, and plain-old CSS can adapt to multiple projects and frameworks.
It remains true that legacy frameworks have varying degrees of capability when
it comes to integrating with platform features newer than 2019, but it's not
impossible by any stretch of the imagination.

## Solving Integration Problems

Rather than being tasked with owning, implementing, and delivering solutions to
legacy framework integration problems, design system teams should be empowered 
to *consult* with and *advise* those teams to solve the problems on their own
terms.

Design system teams can solve integration problems, but they can't own them.
It's crucial for teams to communicate clearly and openly, and to understand the
business needs that design systems solve. When approaching a difficult
integration, everyone at the table needs to understand the boundaries and
junctions between business needs, framework limitations, and design system
priorities. Downstream teams have to be willing to work with design systems
people to integrate solutions which serve the broader business, and design
systems people have to be willing and able to cross the aisle to work with
downstream on their turf.

Clear boundaries and the application of [Postel's law][postel] are the
fundamentals of fruitful large-scale software collaboration.

> Be conservative in what you do, be liberal in what you accept from others.

-----

Many thanks to my design-systems colleagues Steven Spriggs, Brian Ferry, and 
Greg Gibson for their helpful notes on earlier drafts of this post.

[platforms]: https://infrequently.org/2020/06/platform-adjacency-theory/
[frameworks]: https://infrequently.org/series/reckoning/
[postel]: https://en.wikipedia.org/wiki/Robustness_principle
