---
reveal: pre:not(:first-of-type)
---
## Renderers

```lua
local M: Renderer = {}










return M
```
```lua
local M: Renderer = {}

function M.set_lines(buffer: Renderer,
                     lines: {string}): {string}
end






return M
```
```lua
local M: Renderer = {}

function M.set_lines(buffer: Renderer,
                     lines: {string}): {string}
end

function M.get_lines(components: {Component},
                     options: Options,
                     state: RendererState): {string}
end

return M
```
