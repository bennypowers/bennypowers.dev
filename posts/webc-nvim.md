---
title: webc.nvim
published: true
description: New Neovim Plugin - Basic support for WebC files
coverImage: /assets/images/webc-nvim.png
datePublished: 2023-04-23
tags:
  - lua
  - neovim
  - webc
  - eleventy
---

I wrote a [neovim plugin called webc.nvim][webcnvim]. For now it's fairly 
simple, adding Treesitter HTML highlighting for WebC files, keyword highlighting 
for scoped `webc:` attributes, and injections for webc props and dynamic 
attributes.

In the future perhaps it can provide some more goodies like snippets, etc.

Install it with [lazy.nvim][lazy], making sure you have the HTML parser 
installed, first.

```lua
return { 'bennypowers/webc.nvim',
  dependencies = 'nvim-treesitter/nvim-treesitter',
  opts = true,
}
```

[lazy]: https://github.com/folke/lazy.nvim
[webcnvim]: https://github.com/bennypowers/webc.nvim
