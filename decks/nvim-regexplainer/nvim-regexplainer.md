---
layout: deck.html
deck: nvim-regexplainer
title: Regexplainer
date: 2022-12-10
description: >-
  How and why I built the neovim plugin `nvim-regexplainer`, and what I learned
  from the process: lua, nvim APIs, and more.
icons:
  - rel: icon
    href: /assets/images/favicon.ico?v=2
  - rel: shortcut icon
    href: neovim-mark.svg
stylesheets:
  - href: https://fonts.googleapis.com/css2?family=Overpass&family=Hepta+Slab&family=Fira+Code&family=Noto+Mono&display=swap
  - href: /assets/catppuccin-mocha.css
  - href: /decks/nvim-regexplainer/nvim-regexplainer.css
eleventyComputed:
  copyright: "© {{ (datePublished or page.date) | formatDate(year='numeric') }} Benny Powers."
---

<svg id="icons">
  <defs>{% for icon in collections.icon %}
    <g id="{{ icon.fileSlug }}-icon" aria-label="{{ icon.data.title }}">{{ icon.templateContent | safe }}</g>{% endfor %}
  </defs>
</svg>
