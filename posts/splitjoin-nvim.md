---
title: splitjoin.nvim
published: true
description: New Neovim Plugin - separate lists into multiple lines then glue them back together
coverImage: /assets/images/splitjoin.png
datePublished: 2023-02-18
tags:
  - lua
  - neovim
  - treesitter
---

I wrote a [neovim plugin called splitjoin.nvim][sjn] to handle a common task 
when editing code: splitting and joining lists. The plugin is inspired by the 
venerable old [vim-mode-plus][vmp] and takes the place of the older, more 
established, but envimscriptened [SplitJoin.vim][sjv] by Andrew Radev.

Install it with [lazy.nvim][lazy]

```lua
return { 'bennypowers/splitjoin.nvim',
  lazy = true,
  keys = {
    { 'gj', function() require'splitjoin'.join() end, desc = 'Join the object under cursor' },
    { 'g,', function() require'splitjoin'.split() end, desc = 'Split the object under cursor' },
  },
  opts = {
    -- default_indent = '  ' -- default is two spaces
  },
}
```

Give it a whirl and <abbr title="let me know">LMK</abbr> what you think. If you 
like it, I'd be happy if you left a ⭐ on the GitHub repo.

👉 [splitjoin.nvim][sjn]

[vmp]: https://github.com/t9md/atom-vim-mode-plus
[sjv]: https://github.com/AndrewRadev/splitjoin.vim
[lazy]: https://github.com/folke/lazy.nvim
[sjn]: https://github.com/bennypowers/splitjoin.nvim
