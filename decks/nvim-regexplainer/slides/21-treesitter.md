---
reveal: li:not(:first-child), li :is(img, pre):nth-child(2)
name: code
---
{#
- ![local cursor_node = ts_utils.get_node_at_cursor()][cursor-node]
  ![local regexp_node = do_awful_hacks(cursor_node)][awful-hacks]
- ![ts-playground][ts-playground]
#}
- ```lua
  local cursor_node = ts_utils.get_node_at_cursor()
  ```
  ```lua
  local cursor_node = ts_utils.get_node_at_cursor()
  local regexp_node = do_awful_hacks(cursor_node)
  ```
- ![ts-playground][ts-playground]

[cursor-node]: cursor-node.png
[awful-hacks]: awful-hacks.png
[ts-playground]: ts-playground.png
