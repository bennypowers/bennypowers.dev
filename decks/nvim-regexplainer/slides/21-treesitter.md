---
reveal: pre:not(:first-of-type), img, p:not(:first-of-type)
---

## Components

```lua
local cursor_node = ts_utils.get_node_at_cursor()
```
```lua
local cursor_node = ts_utils.get_node_at_cursor()
local regexp_node = do_awful_hacks(cursor_node)
```

![ts-playground][ts-playground]

Everything we need

[ts-playground]: ts-playground.png

<section slot="notes">

- do hacks to cross between host language and regex trees
- there's lots of room for improvement here

</section>
