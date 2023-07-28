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
