---
attrs: id="monad" background=--secondary
---
## Monad

Like a functor, Monads can map over their contents.
Monads have the added ability to unwrap their self-similar 
contents. This power is called `chain`, `bind`, or `flatMap`


```js
[1]
  .map(x => [x + 1]) // [ [ 2 ] ]

[1]
  .flatMap(x => [x + 1]) // [2] 
```

