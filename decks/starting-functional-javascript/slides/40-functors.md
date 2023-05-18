---
attrs: id="functors" background=--secondary
---
## Functors

A functor is a container for some value, like an envelope. Functors can map 
from some value `x` in a category to another value `y` in that same category.
`Array` and `Promise` are both functors.

```js
const inc = x => x + 1

[1].map(inc) // [2]

Promise.resolve(2)
  .then(inc) // Promise 3
```  

<style>#functors { color: white; }</style>
