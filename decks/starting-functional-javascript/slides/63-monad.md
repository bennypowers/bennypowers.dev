---
attrs: id="maybe-monad-applicative" background=--primary
reveal: p:not(:first-child), pre
---
## Maybe Monad - Binary
<div explanation floating>

  Wait!! People code like that?

  _**👉 NOPE 👈**_

  Monads are also applicatives, which means we can lift any function into 
  'monadic space' with `lift`

</div>

```js
import { liftA2 } from 'crocks';

const add = (x, y) => x + y;

const safeAdd = (x, y) =>
  liftA2(add, safeNumber(x), safeNumber(y))
```

