---
title: Centring Overlapping Content with CSS Grid
description: How to overlay content on top of an image or other element simply using CSS Grid.
published: true
datePublished: 2019-06-28
coverImage: https://thepracticaldev.s3.amazonaws.com/i/qxg70fwmu6u3sndtcxz1.jpg
tags:
  - css
  - layout
---

So you've got an image and you want to centre some content over it.

```html
<figure id="beshalach">
  <a href="/beshalach-1520/"><img src="./images/beshalach-15-20.jpg" alt="Exodus 15:20" /></a>
  <figcaption><a href="/beshalach-1520/">Exodus 15:20</a></figcaption>
</figure>
```

In the past, you'd probably have reached for our old friend absolute
positioning:

```css
figure {
  position: relative;
}

figcaption {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

This is fine. `git commit -m "Job's done" && git push`. *Buuut* maybe we can do
a little better. Using CSS grid we can accomplish the same result, but in what
strikes me as a more declarative syntax.

```css
figure {
  display: grid;
  place-items: center;
  grid-template-areas: 'image'
}

figure > * {
  grid-area: image;
}
```

With these rules, we've defined a 1-by-1 grid with a single area named
'images', which all of its content fits into. With that established, the source
order takes over to paint the caption on top of the image. No need for
position, z-index, etc.

This has several advantages: 
1. It's **declarative**. These styles describe the intended outcome, instead of
   the steps the developer thought should be taken.
2. It's **readable**. I don't know about you, but future me probably wouldn't
   see `top: 50%; left: 50%; transform: translate(-50%, -50%);` and immediately
   think "centred!"
3. Flex and Grid have a simpler mental model for [stacking context][stacking]
   which is the darkest of black arts.

So next time you need to overlap content, consider using `grid` instead of
`position`.

[stacking]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
