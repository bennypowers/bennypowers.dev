---
layout: deck.html
deck: nvim-regexplainer
title: Regexplainer
date: 2022-12-10T20:55+02
venue:
  name: NeovimConf 2022
  url: https://www.neovimconf.live/
coverImage: /decks/nvim-regexplainer/cover.png
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
eleventyComputed:
  copyright: "© {{ (datePublished or page.date) | formatDate(year='numeric') }} Benny Powers."
tags:
  - deck
---

<style>{% renderFile './decks/nvim-regexplainer/nvim-regexplainer.css', {}, 'postcss' %}</style>
<svg id="icons">
  <defs>{% for icon in collections.icon %}
    <g id="{{ icon.fileSlug }}-icon" aria-label="{{ icon.data.title }}">{{ 
    icon.content | safe }}</g>{% endfor %}
  </defs>
</svg>
