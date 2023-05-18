---
attrs: id=composition fade-in background=--primary
---
## Function Composition

Combines many functions into one by applying each function to the result of the 
previous one. In other words, makes one function from two (or more) others.

```js
// binary compose
const compose =
  (f, g) =>
    x => f(g(x))

const addTwice2 = compose(add(2), add(2))
const deepSerialClone = compose(JSON.parse, JSON.stringify)
const isAdmin = compose(
  x => x === 'admin',
  ({ role }) => role
)
```

<style>
#composition {
    & h2 { text-transform: uppercase; }
    & pre { font-size: 80%; }
}
</style>
