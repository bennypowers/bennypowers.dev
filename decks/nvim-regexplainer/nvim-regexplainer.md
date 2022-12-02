---
layout: deck.html
deck: nvim-regexplainer
title: Building Regexplainer Neovim Plugin
date: 2022-12-10
description: >
  How and Why I built the neovim plugin `nvim-regexplainer`, and what I learned
  from the process: lua, nvim APIs, and more.
icons:
  - rel: icon
    href: /assets/images/favicon.ico?v=2
  - rel: shortcut icon
    href: >-
      data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' 
      height='1024' viewBox='0 0 1024 1024'%3E %3Cg fill='none' 
      fill-rule='evenodd'%3E %3Crect width='1024' height='1024' 
      fill='%23464A5B'/%3E %3Ctext font-family='UbuntuMono-Regular, Ubuntu Mono' 
      font-size='1064' letter-spacing='-64.101'%3E %3Ctspan x='3.601' y='788.64' 
      fill='%23C5DFF0'%3Eb%3C/tspan%3E %3Ctspan x='471.5' y='788.64' 
      fill='%23FFF' letter-spacing='-64.222'%3Ep%3C/tspan%3E %3C/text%3E 
      %3C/g%3E %3C/svg%3E'
  - rel: apple-touch-icon
    sizes: 72x72
    href: /assets/images/manifest/icon-72x72.png
  - rel: apple-touch-icon
    sizes: 48x48
    href: /assets/images/manifest/icon-48x48.png
  - rel: apple-touch-icon
    sizes: 72x72
    href: /assets/images/manifest/icon-72x72.png
  - rel: apple-touch-icon
    sizes: 96x96
    href: /assets/images/manifest/icon-96x96.png
  - rel: apple-touch-icon
    sizes: 144x144
    href: /assets/images/manifest/icon-144x144.png
  - rel: apple-touch-icon
    sizes: 192x192
    href: /assets/images/manifest/icon-192x192.png
stylesheets:
  - href: /assets/catppuccin-mocha.css
  - href: /decks/nvim-regexplainer/nvim-regexplainer.css
---

<svg id="icons">
  <defs>{% for icon in collections.icon %}
    <g id="{{ icon.fileSlug }}-icon" aria-label="{{ icon.data.title }}">{{ icon.templateContent | safe }}</g>{% endfor %}
  </defs>
</svg>
