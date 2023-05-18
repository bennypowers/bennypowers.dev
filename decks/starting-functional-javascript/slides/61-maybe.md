---
attrs: id="maybe-monad" background=--primary
---
## Maybe Monad

The Maybe monad wraps a value which may not exist. It has two instances: `Just 
a` and `Nothing`. Mapping over a `Just` works as expected. Mapping over a 
`Nothing` skips execution.

```js
import { ifElse, isNumber, Just, Nothing, chain } from 'crocks'

const safe = p => ifElse(p, Just, Nothing)

const gt10 = x => x > 10

const safeNumber = safe(isNumber)

const maybeBig = safe(gt10)

const bigNumber = compose(
  chain(maybeBig),
  safeNumber
)
```


