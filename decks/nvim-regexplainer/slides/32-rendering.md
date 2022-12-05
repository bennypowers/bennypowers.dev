```lua
function M.render(buffer: Buffer,
                  renderer: Renderer,
                  components: {Component},
                  options: Options,
                  state: RendererState)
  local lines = renderer
    .get_lines(components, options, state)
  buffer:init(lines, options, state)
  renderer.set_lines(buffer, lines)
  buffer:after(lines, options, state)
end
```
