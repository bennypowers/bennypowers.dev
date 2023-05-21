---
title: Toggle Markdown Image Syntax with Treesitter
published: true
description: |
    Use Neovim's treesitter and lua APIs to script a function that toggles
    between HTML and markdown image synax
templateEngineOverride: webc,md
coverImage: /assets/images/markdown-images-treesitter.png
coverImageAlt: a table made of trees
datePublished: 2023-05-21
tags:
  - lua
  - neovim
---

A markdown image is an exclamation mark, followed by a pair of brackets, 
followed by a pair of parentheses. The image's alt-text goes in the brackets, 
and it's source URL goes in the parens.

```md
![A table made of trees](markdown-images-treesitter.png)
```

While HTML images can have their attributes in any order, I've noticed that 
authors tend to put the `src` attribute before the `alt` attribute. One of the 
things I like about Markdown images is that they encourage the author to think 
about alt text first.

```html
<img src="markdown-images-treesitter.png"
     alt="A table made of trees">
```

Markdown has limited HTML parsing capability, which means markdown files can 
contain HTML `<img>` tags and will work properly when they do, so mixing 
syntaxes in one file isn't a huge problem. In fact there are times when it's 
preferable to do so. But the terser and more text-oriented markdown syntax can 
be useful in different situations, like markdown tables, so I generally prefer 
to use it whenever I'm able.

## The Wrists-Forward Approach

For these reasons, I often find myself converting HTML images to markdown syntax 
and vice-versa when working on blog posts, slide decks, or documentation. My 
typical approach using stock vim mappings would look something like this: For 
HTML to markdown, from the opening angle bracket,
1. <key-seq>i ! [ ] ( Escape</key-seq> to create the markdown image.
2. <key-seq>f " d i "</key-seq> to get the alt text (assuming alt came first)
3. <key-seq>0 f [ p f < d a < </key-seq> to paste it into the brackets
4. repeat the process for the `src`.

If the `src` attribute comes first, as it often does, the motions will have to 
reflect that.

This task is simple enough, or at least, vim makes it quicker than a typical 
editor. However, this still involves *eight* discrete actions (insert, find, 
delete, move, find, put, find, delete). When you have a handful of images per 
file, and dozens of files to review, the effort stacks up quickly. And moreover, 
that's a lot of things to think about! We can do better. Treesitter knows the 
structure of our document. We can use it to *find* the alt text and source URL 
for us, and automatically convert back and forth between markdown and HTML.

## Treesitter Queries

We start by writing custom queries for the `html` and `markdown_inline` 
treesitter parsers. Note that we have to use `markdown_inline` and not 
`markdown` for [reasons][mdil].

<figure>

```scheme
((element
  (_
    (tag_name) @_tag
    (attribute) @image.html.attr +) @image.html
    (#eq? @_tag "img")))
```
  <figcaption>queries/html/images.scm</figcaption>
</figure>

<figure>

```scheme
(image
  (image_description) @image.markdown.alt
  (link_destination) @image.markdown.src) @image.markdown
```
  <figcaption>queries/markdown_inline/images.scm</figcaption>
</figure>

These queries capture the `img` tag (`@image.html`) and all attributes 
(`@image.html.attr`) in the html case; for markdown, they will get the entire 
image (`@image.markdown`), the `alt` text (`@image.markdown.alt`), and the `src` 
(`@image.markdown.src`).

## It's Lua Time!

Now let's define a custom command, called `MarkdownToggleImages`.

```lua
command = vim.api.nvim_create_user_command

command('MarkdownToggleImage', function()
  -- tbd
end, { desc = 'Toggle Markdown image syntax' })
```
Our function will work like so:
1. determine the injected language at the cursor position;
1. try to parse the image query for that language, and if we succeed;
1. store a reference to the image node (so we can later replace it by range);
1. in the HTML case:
   1. store the key/value pairs of all attributes;
   1. pick the `src` and `alt` values and store them with the node;
1. in the markdown case:
   1. store the text values of the queried `alt` and `src` texts
1. finally, replace the node's text with the opposite specie's template.

Because treesitter grammars can be nested (i.e. injected), neovim's treesitter 
integration provides a `LanguageTree` object which holds the collection of trees 
in a buffer and their relationships. The `markdown` parser can inject both the 
`html` and `markdown_inline` parsers, so let's get the specific language tree at 
the cursor position. `nvim-treesitter` provides a utility for this, which 
iterates through all the language trees in a range and gives back the syntax 
tree which contains the range.

```lua
local ts_utils = require'nvim-treesitter.ts_utils';
local row, col = unpack(vim.api.nvim_win_get_cursor(0))
local root, _, langtree = ts_utils.get_root_for_position(row - 1, col)
local lang = langtree:lang()
if lang == 'html' then
  return html_to_md(row - 1, root)
elseif lang == 'markdown_inline' then
  return md_to_html(row - 1, root)
end
```

Now that we have the language and concrete tree at the cursor position, we need 
to parse the query for that language it and run our `images` query (if it 
exists). Let's do the markdown version first because its' query gets the data 
directly

```lua
local function get_image_md(row, root)
  local query = vim.treesitter.query.get('markdown_inline', 'images')
  if not query then return end
  local node
  local alt
  local src
  for id, _node in query:iter_captures(root, 0, row, row + 1) do
    local cap = query.captures[id]
    if cap == 'image.markdown' then
      node = _node
    elseif cap == 'image.markdown.alt' then
      alt = get_node_text(_node, 0)
    elseif cap == 'image.markdown.src' then
      src = get_node_text(_node, 0)
    end
  end
  return node, alt, src
end
```

Now let's do the HTML version, which has to process arbitrary attributes because 
of the less sophisticated query

```lua
local function get_image_html(row, root)
  local query = vim.treesitter.query.get('html', 'images')
  if not query then return end
  local node
  local alt
  local src
  for id, _node in query:iter_captures(root, 0, row, row + 1) do
    local cap = query.captures[id]
    if cap == 'image.html' then
      node = _node
    elseif cap == 'image.html.attr' then
      local name, value
      for child in _node:iter_children() do
        local text = get_node_text(child, 0);
        local type = child:type()
        if type == 'attribute_name' then
          name = text
        elseif type == 'attribute_value' then
          value = text
        elseif type == 'quoted_attribute_value' then
          value = text:gsub('^[\'|"](.*)[\'|"]$', '%1')
        end
      end
      if name == 'alt' then
        alt = value
      elseif name == 'src' then
        src = value
      end
    end
  end
  return node, alt, src
end

```

Now all we have to do is replace our node's range with a formatted template

```lua
local function replace_node_text(node, replacement)
  local srow, scol, erow, ecol = vim.treesitter.get_node_range(node)
  vim.api.nvim_buf_set_text(0, srow, scol, erow, ecol, { replacement })
end

local function html_to_md(row, root)
  local node, alt, src = get_image_html(row, root)
  if node then
    replace_node_text(node, ('![%s](%s)'):format(alt, src))
  end
end

local function md_to_html(row, root)
  local node, alt, src = get_image_md(row, root)
  if node then
    replace_node_text(node, ('<img alt="%s" src="%s">'):format(alt, src))
  end
end
```

If you find yourself doing this kind of thing often, I hope these snippets are 
helpful to you. I even [added] it to my [dial.nvim][dial] config to make it as 
easy as `<c-a>`.

[mdil]: https://github.com/nvim-treesitter/nvim-treesitter/pull/3048
[dial]: https://github.com/monaqa/dial.nvim
[added]: https://github.com/bennypowers/dotfiles/blob/8a733352f71ec08732145b19bfe0ee843b69d24e/.config/nvim/lua/plugins/editing/dial.lua#L3

