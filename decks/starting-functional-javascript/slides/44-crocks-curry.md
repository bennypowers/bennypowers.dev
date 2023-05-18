---
attrs: id="crocks-curry" fade-in background=--secondary
---
## Crocks Curry

Crocks' curry is very flexible.

```js
import curry from 'crocks/helpers/curry'

const wellCurried = curry(
  (x, y) => z => (foo, bar) => 'baz'
)

wellCurried(1) // curry((y, z, foo, bar) => 'baz')
wellCurried(1, 2, 3) // curry((foo, bar) => 'baz')
```
<style>#crocks-curry { color: white; }</style>
<style>#crocks-curry h2 { color: var(--primary); }</style>
