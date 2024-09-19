---
title: Your Design System is Not a Solution
published: true
tags:
  - design systems
  - web components
audience: Team leaders, design system engineers, product managers.
tldr: >
coverImageAlt: >-
coverImage: null
---

You've got a problem. Your painting fell, and you want to hang it back up.
You grab a hammer and some nails, you get to swinging, you make a few
adjustments, and *Hey Presto!* before you know it, your problem is solved.

You have implemented a solution: you hung the painting.

Just then, your neighbour knocks on the door. Wouldn't you know it? he *also*
has a problem. *His* painting has fallen, too. He *also* needs a solution. Being 
the magnanimous, good-looking, and preturnaturally charming neighbour that you 
are, you leap into motion, practically stuffing his arms with hammer and nails, 
and you send him on his way, richly satisfied by your own generosity.

An hour later, he knocks again. You see - your house is built of timber and
drywall, while your neighbour's house is built of cinderblocks and plaster. Your
neighbour now has two problems - his painting is still on the floor, *and* he 
now has an unsightly hole in the wall.

## Tools and Solutions

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
wrong?
was it the tools you gave him? Not necessarily. He might have used the hammer 
you gave him to drive special cinderblock nails or those plastic-and-tack 
plaster hooks.

The problem wasn't the tools - *the problem was seeing the tools as the 
solution*.

Jackhammers require care in use. Thumbtacks are cheap, plentiful, and not 
particularly dangerous both are needed on a construction site - one to break 
large blocks of concrete and rock, one to hang plans and blueprints. Both tools 
are important - crucial even - in their own ways, but they have widely different 
requirements on them

## Why Design Systems?

If you've been following along, you're probably waiting for the punch line,
so here it is:

> Your design system is not a solution, it's a *toolkit*

So why do companies adopt design systems? Are they just spinning their wheels?
Well, my desire to continue receiving a steady paycheque requires me to say "no, 
they aren't, design systems really do solve problems for companies!" But there's
an important difference between the kind of problem which design systems solve
and *your team*'s design problem.

Companies adopt design systems because they want:

- a "single source of truth"
- consistent visual style across large teams
- consistent standards of accessibility
- ux/ui recommendations lovingly crafted by specialists

All of these are fancy ways of saying they want to establish and enforce
rules and guidelines for producing user interfaces. Design systems help solve 
that problem by centralizing the know how for building the components of those 
interfaces in a way which can be easily ported to different teams'
workflows.

## Solving the Wrong Problem

Design systems can't and shouldn't try to solve every team's problems. This
industry is by it's nature prone to widely varied opinions and approaches, often 
incompatible one with the other, and establishing a baseline is hard enough 
without shipping bespoke implementations for each team that comes along.

:up: ELABORATE HERE

> If you don't own the problem, you can't own the solution

:up: ELABORATE HERE

The specialist skills needed to produce a design system are not the same as 
those needed to ship products. Product teams often need to move quickly to ship
new features, built on top of the previous framework, and they often don't have
the luxury of The Big Rewrite™.

## Aiming for the End User?

Even if your organization is made of money, it's still silly and wasteful to 
reimplement your design system for every framework that comes along.

## Solving Integration Problems

- design systems can solve integrations problems
- but they can't own them - everyone involved has to clearly understand the 
difference between DS problems, framework problems, and business problems
- downstream teams have to be willing to work with ds people to solve problems 
on downstream turf <- FIND BETTER WORDS FOR THIS

Example:
- mktg needs to inject content, client side
- this content needs to use design system assets
- this content has to be federated to 

Design systems that rest on platform features like custom elements, shadow DOM,
import maps, and plain-old CSS can adapt to multiple projects and frameworks.
It remains true that legacy frameworks have varying degrees of capability when
it comes to integrating with platform features newer than 2019, but it's not
impossible by any stretch of the imagination.
