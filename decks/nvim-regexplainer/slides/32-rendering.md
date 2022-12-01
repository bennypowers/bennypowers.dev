```lua
function M.render(
  buffer: RegexplainerBuffer,
  render: RegexplainerRenderer,
  components: RegexplainerComponent[],
  options: RegexplainerRendererOptions,
  state: RegexplainerRendererState
)
  local lines = renderer
    .get_lines(components, options, state)
  buffer:init(lines, options, state)
  render.set_lines(buffer, lines)
  buffer:after(lines, options, state)
end
```
