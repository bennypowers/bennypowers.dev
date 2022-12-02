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
  - href: /assets/catppuccin-mocha.css
  - href: /decks/nvim-regexplainer/nvim-regexplainer.css
---

<svg id="icons">
  <defs>{% for icon in collections.icon %}
    <g id="{{ icon.fileSlug }}-icon" aria-label="{{ icon.data.title }}">{{ icon.templateContent | safe }}</g>{% endfor %}
  </defs>
</svg>
