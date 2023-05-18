---
attrs: id="pointfree" fade-in background=--primary
---
## Pointfree Style

Functions which reference their own data are said to be "pointed".
Likewise, functions which do not reference their parameters 
are said to be "pointfree".
With curried and point-free functions, always take your 
*data* as the *last* parameter.


```js
const map = f => xs => xs.map(f)
const filter = p => xs => xs.filter(p)
const assign = a => o => ({ ...o, ...a })
const handleAsJson = resp => resp.json()

fetch('/users')
  .then(handleAsJson)
  .then(filter(isAdmin))
  .then(map(assign({admin: true}))
```
<style>#pointfree pre {font-size: 80%}</style>
