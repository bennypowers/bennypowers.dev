---
title: Sorting and Dating 11ty Posts by Name
published: true
description: |
  Organize and automate your 11ty blog's post structure with ISO dates and
  some quick JavaScript.
coverImage: /assets/images/posts.11tydata.cjs.png
coverImageAlt: screenshot of post-date function (elaborated in post)
tags:
  - eleventy
---

Eleventy has some pretty cool [post dating features][dates]. For my blog
though, I added a draft feature which led me to add my own custom date property,
`datePublished`. This also let me avoid subtle bugs that could come up when the 
filesystem or git database changed for reasons other than a post edit.

This system worked pretty well but there were a few drawbacks:
1. I had to add the `datePublished` to each post's frontmatter
2. Posts appear out of order in the file system

To solve these problems I configured 11ty to derive the post's `datePublished`
from an ISO date at the beginning of the file. One of the advantages of ISO-8601
date strings, and thus a reason why they are the [only legit date format][xkcd],
is that they are lexically sortable. That's a fancy way to say that if you sort
them character-by-character, you'll always end up sorting them by date.

So my solution involved parsing either the input path when computing the 
`datePublished` and the `permalink` using a regular expression:

<figure>

  ```js
  const POST_DATE_RE = /(?<prefix>^.*\/)(?<date>\d{4}-(?:[0]\d|1[0-2])-(?:[0-2]\d|3[01]))-(?<suffix>.+)/;
  ```

  <figcaption>

Regex with three named capture groups:
1. `prefix` is *anything* followed by a `/`
2. `date` is an ISO-8601 date string
3. a `-`
3. `suffix` is anything after the `-`

  </figcaption>

</figure>

With this regex, I laid out my posts dir like so:

<figure style="display:flex;flex-flow:row wrap;gap:1em;">
  <img alt="" src="/assets/images/posts-dir-sorted.png">
  <figcaption id="posts-dir" class="visually-hidden"><pre>posts
├── 2022-01-07-lets-write-a-redux-controller-for-web-components.md
├── 2022-11-14-form-associated-custom-elements.md
├── 2022-12-12-micro-dreidle.md
├── 2022-12-25-8-days-5783.md
├── 2023-01-01-microbit-countdown.md
├── 2023-01-15-11ty-svg-sprites.md
├── 2023-01-31-cheap-netlify-11ty-rebuilds.md
├── 2023-02-18-splitjoin-nvim.md
├── 2023-02-19-microcopy-reactive-controller.md
├── 2023-03-19-microbit-spruce-up-tug-of-led.md
├── 2023-04-11-webc-impressions.md
├── 2023-04-13-11ty-wrap-emoji.md
├── 2023-04-14-eli5-web-components.md
├── 2023-04-14-sefira-isru-hag-pesah.md
├── 2023-04-23-webc-nvim.md
├── 2023-04-26-adelman.md
├── 2023-05-09-import-map-cdn.md
├── 2023-05-21-markdown-images-treesitter.md
├── 2023-07-10-debugging-gnome-extensions-dbus-run-session.md
├── 2023-07-23-webc-dsd-slot-workaround.md
├── 2023-07-28-sort-and-date-11ty-posts-by-name.md
├── index.11tydata.cjs
├── index.css
├── index.webc
├── lets-build-web-components
│   ├── part-1-the-standards.md
│   ├── part-2-the-polyfills.md
│   ├── part-3-vanilla-components.md
│   ├── part-4-polymer-library.md
│   ├── part-5-litelement.md
│   ├── part-6-gluon.md
│   ├── part-7-hybrids.md
│   └── part-8-mythbusters.md
├── posts.11tydata.cjs
└── posts.yaml

2 directories, 45 files</pre>
  </figcaption>
</figure>

Next step is to extract the `datePublished` from the filename, and rewrite the 
`permalink` to remove the date.

<figure>

  ```js
  module.exports = {
    eleventyComputed: {
      datePublished({ datePublished, page }) {
        const { date } = page.inputPath?.match(POST_DATE_RE)?.groups ?? {};
        if (!datePublished && date)
          return new Date(date);
        else
          return datePublished;
      },
      permalink({ permalink, page }) {
        const match = page.inputPath.match(POST_DATE_RE);
        if (match && !page.filePathStem.endsWith('/index'))
          return `${page.filePathStem}/index.html`
        else
          return permalink
      }
    }
  }
  ```

  <figcaption>posts/posts.11tydata.cjs</figcaption>
</figure>

As a bonus, I wrote this sorting function for [neo-tree][neo-tree] to sort
*only* my posts directory in descending order:

<figure>

```lua
require'neo-tree'.setup {
  -- ...
  sort_function = function(a, b)
    if a.path:match[[bennypowers.dev/posts/.+]] and a.type == b.type then
      return a.path > b.path
    -- default sort
    elseif a.type == b.type then
      return a.path < b.path
    else
      return a.type < b.type
    end
  end,
  -- ...
}
```

  <figcaption>~/.config/nvim/lua/plugins/ui/neo-tree.lua</figcaption>
</figure>

Hope you found this helpful.

[dates]: https://www.11ty.dev/docs/data-eleventy-supplied/#date
[xkcd]: https://xkcd.com/1179/
[neo-tree]: https://github.com/nvim-neo-tree/neo-tree.nvim
