---
title: SVG Icon Sprites in Eleventy
published: true
templateEngineOverride: webc,md
description: Use SVG icons in Eleventy and only ship the code you need.
datePublished: 2023-01-15
coverImage: /assets/images/sprite-sheet.png
coverImageAlt: sprite sheet for a pixel-art game featuring a female mage character
tags:
  - eleventy
  - html
  - svg
  - performance
eleventyImport:
  collections:
    - icon
---
<style>
#examples {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  align-items: center;
  justify-content: center;

  & svg {
    fill: currentcolor;
    height: 40px;
    aspect-ratio: 1;
  }
}

#cover-image {
  image-rendering: optimizespeed;
}
</style>

So you want to put some SVG icons on your [11ty](https://11ty.dev) site, hey? 
This technique lets you include icons in your posts easily. With a little 
initial investment, adding and using icons should be easy for you and easy on 
your users.

<div id="examples">
  <sprite-icon name="11ty"></sprite-icon>
  <sprite-icon name="svg"></sprite-icon>
  <sprite-icon name="a11y"></sprite-icon>
  <sprite-icon name="html5"></sprite-icon>
  <sprite-icon name="javascript"></sprite-icon>
  <sprite-icon name="jerusalem"></sprite-icon>
  <sprite-icon name="redhat"></sprite-icon>
  <sprite-icon name="ness"></sprite-icon>
</div>

## Step 1: The Collection

Let's start by creating a collection for our icons. In a directory of your 
choosing (mine is called `/icons`), add an 11ty directory data file (e.g. 
`icons.json`), and include the following contents:

```json
{
  "permalink": false
  "tags": [
    "icon"
  ]
}
```

The `permalink: false` setting prevents 11ty from writing the icons to the 
output dir, and the tag adds each one to the new `icon` collection.

Populate the `/icons` directory with your SVG files.

## Step 2: The Shortcode

That having been accomplished, let's define the [shortcode][shortcodes] that 
we'll use to display icons on our pages. The shortcode will take a name and an 
optional map of HTML attributes, and works like this:

```njk
{% icon 'html5' %}
{% icon 'svg', 'aria-labelledby'='svg-w3c' %}
{% icon '11ty', title='eleventy' %}
```

By storing a set of icons requested on each `page` object, our sprite sheet will 
only render those icons as actually are needed, saving your readers' data. 
What's more, since we use `use href` to actually display the icons, we only need 
to render each SVG drawing once per page, further reducing page sizes when there 
are multiple instances of the same icon in use.

```js
eleventyConfig.addShortcode('icon', function icon(name, kwargs) {
  this.ctx.page.icons ||= new Set();
  this.ctx.page.icons.add(name);
  const { __keywords, ...attrs } = kwargs ?? {}
  const attributes =
    Object.entries(attrs)
      .map(([name, value]) => `${name}="${value}"`)
      .join(' ');
  return `<svg ${attributes}><use href="#${name}-icon"></use></svg>`;
});
```

Abusing the `page` object like this kinda gives me the creeps, but 🤷, its 
works!

## Step 2: The Sprite Sheet

With our icons and shortcodes up and running, we still can't see any icons on 
our pages, so let's add our sprite sheet to our base HTML. Put the following 
[nunjucks][njk] snippet just before the `</body>` tag of your most basic page 
template: 

```njk
{% if page.icons %}
<svg id="icon-sprite-sheet">
  <defs>
    {% for icon in collections.icon %}
      {% if page.icons.has(icon.fileSlug) %}
        <g id="{{ icon.fileSlug }}-icon">{{ icon.content | safe }}</g>
      {% endif %}
    {% endfor %}
  </defs>
</svg>
{% endif %}
```

The `if` nunjucks tag ensures that only icons that had been requested on _this_ 
page via shortcode actually get printed to the final HTML.

Let's now add some [visually-hidden][vishide] styles to our sprite sheet, so it 
won't take up any space on the page.

```css
#icon-sprite-sheet {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

## Accessibility Concerns

Make sure that each icon you use either has a `<title>` in the SVG, or use 
`aria-label*`, or remove the icon from the a11y tree.

This technique could be a nice little optimization for your pages, or could turn 
out to seriously cut down on your bytes-over-the-wire, depending on how you use 
icons.

If you have any ideas for improvements, let me know on [mastodon][mastodon].

[njk]: https://mozilla.github.io/nunjucks/templating.html
[vishide]: https://www.tpgi.com/the-anatomy-of-visually-hidden/
[shortcodes]: https://www.11ty.dev/docs/shortcodes/
[mastodon]: https://social.bennypowers.dev

