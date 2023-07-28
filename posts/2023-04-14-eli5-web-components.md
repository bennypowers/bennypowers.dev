---
title: ELI5 What are Web Components
published: true
audience: precocious five-year olds, snarkhounds, the anti-javascript javascript club
templateEngineOverride: webc,md
description: >
    Explain to me like I'm 5-years-old what web components are and how they're 
    different from javascript frameworks
tldr: >
    #eli5 (explain to me like I'm 5-years-old) what #WebComponents are and how 
    they're different from #javascript-heavy #frameworks
coverImage: /assets/images/Lego_Color_Bricks.jpg
coverImageAlt: a loose pile of colourful lego bricks
tags:
  - eli5
  - html
  - web components
---

<style>figure { float:right; }</style>

## Making your Own Lego
So if you want to see a website you need a tool called a browser. The browser is 
basically a box of lego pieces (HTML elements). Everyone agrees on what goes 
into the box, such that people who built websites can reliably choose which 
bricks to use to build them.

About 10 years ago, some of the people who make and fill up the boxes of lego 
(browser developers) thought it would be a good idea to include a 3D printer in 
the kit, so that website builders could invent their own kinds of bricks. The 
kit-makers started writing into the kit-making recipe (the HTML specification) 
about how the printer should work and what it should be able to do ([custom 
elements][ce], [Shadow DOM][sd], [`<template>` elements][te], etc).

<figure-img src="/assets/images/makerbot.jpg" width="200">
  MakerBot Cupcake CNC 3D Printer. [Photo][printer] by John Biehler
</figure-img>

## Doing it the Hard Way
Now, before this, the lego box already came standard with some 
[Technic][technic] pieces like motors, gears and pulleys. This let website 
builders do things like add animations or cute little interactions to their 
pages. At the same time that browser makers were starting to write the first 
draft of the 3D printer part of the lego-box instructions, a small but very loud 
group of website builders started convincing other website builders that the 
best way to build lego was to put the technic blocks together to build a 
complicated machine that would stack and unstack the blocks for them (javascript 
frameworks). In other words they thought that instead of people getting a 
completed lego work (website), it was better to send a lego technic schematic 
for machines which would then put the intended lego work together for you. 

Technic is pretty cool and you can make really neat stuff with it, but most kids 
just wanted to play with the lego work (HTML), instead of with a technic machine 
which builds lego works (framework <abbr title="single page 
application">SPA</abbr>s). It's kinda weird because Technics is supposed to be 
for adding cool mechanical stuff on top of the lego work ([progressive 
enhancement][pe]), not for making lego-building machines. The kit-makers are 
supposed to be in charge of that kind of thing, instead.

## What Web Standards have to do with Global Inequality
Anyways, the rich kids that had lots of lego and only the fanciest and most 
powerful technic blocks in their boxes (expensive iPhones), wouldn't really 
notice the difference because their fancy technics blocks would build the lego 
work (client side rendering) really fast, but most people in the world didn't 
have the fanciest legos, they only had the plain pieces (low powered Android), 
so having to play lego this way was slow and boring, and some couldn't play at 
all (poor accessibility practices).

<figure-img src="/assets/images/technic-porsche.jpg" width="200">
  Replica of part of a Porsche engine, built out of lego technic. 
  [Photo][porsche] by Vyn Raskopf
</figure-img>

Now you'd think that each standard lego box coming with it's own 3D printer 
would improve things because then everyone could get nicer pieces faster and 
website makers could concentrate more on the final work than on the inner 
workings of the technic machines, and actually in a lot of the houses in the 
neighbourhood that's what happened. But at recess time on the school yard the 
cool technic kids (framework authors) just yelled louder than anyone else, and a 
lot of the younger kids ended up thinking that the only way to build legos was 
by spending most of their time tweaking complicated technic machines, instead of 
snapping bricks together.

## Framework Hype
Most of the older kids and some of the younger ones went to play a different, 
less educational game ([native apps][platform]) and the kids left behind didn't 
have such a fun time playing lego anyways ([framework churn][churn]) - actually 
most of them just had to sit and watch (high barrier to entry) while the cool 
kids argued about the best way to connect a rubber belt from one piece to the 
other. What's worse, is that even on the cool kids side of the yard, where you 
had to start building your technic machine early in the morning if you wanted to 
see your lego work built by recess, the younger kids have to choose which bully 
to hang out with, because they each have their turf and like to punish kids for 
hanging with anyone else (lack of [interop][ceereact] between frameworks).

So now the schoolyard sounds like it's full of happy kids, but it's mostly just 
a handful of bullies loudly talking themselves up and their peers down while the 
rest of the school either builds legos in the lunch room with cool 3D printed 
custom pieces, or gives up on lego altogether and spends recess sitting silently 
in the library scrolling tiktok.

[ce]: https://html.spec.whatwg.org/multipage/custom-elements.html
[sd]: https://dom.spec.whatwg.org/#concept-shadow-root
[te]: https://html.spec.whatwg.org/multipage/scripting.html#the-template-element
[technic]: https://www.lego.com/en-us/themes/technic
[printer]: https://www.flickr.com/photos/retrocactus/7437657074
[porsche]: https://www.flickr.com/photos/vynsane/27137628581
[pe]: https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement
[churn]: https://duckduckgo.com/?q=javascript+fatigue
[ceereact]: https://custom-elements-everywhere.com/#react
[platform]: https://infrequently.org/2020/06/platform-adjacency-theory/
