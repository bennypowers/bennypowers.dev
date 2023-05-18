---
attrs: id="monoids-mreduceMap" fade-in background=--primary
class: small-code
---
## `mreduceMap`

Folds an array under a monoid of your choice, first 
mapping your monoid constructor over it.

```js
import { All, Any } from 'crocks'
import { compose, mreduceMap } from 'crocks/helpers'
import isNil from 'crocks/predicates/isNil'
import not from 'crocks/logic/not'

const hasToken = compose(not(isNil), propOr(null, 'token'))
const isFraud = compose(greaterThan(0.5), propOr(0, 'score'))

const allAreUsers = mreduceMap(All, hasToken)
const anyAreFraud = mreduceMap(Any, isFraud)
```

