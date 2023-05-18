---
attrs: id="crocks-helpers" fade-in progressive background=--secondary
reveal: pre:not(:first-of-type)
---
## Crocks Helpers

```js
import propOr from 'crocks/helpers/propOr'
import propPathOr from 'crocks/helpers/propPathOr'

// propOr :: A -> String -> {[String]: A} -> A
propOr(null, 'name', { name: 'ftr' })   // 'ftr'
propOr(null, 'name', { date: '2019' })  // null

// helpers are curried by default
const getName = propOr(null, 'name')
      getName({ name: 'Forter' }) // 'Forter'

const getFirstCourseId = propPathOr(null, ['courses', '0', 'id'])
      getFirstCourseId({ courses: [{ id: 1 }] })  // 1
      getFirstCourseId({ courses: 'blammo!' })    // null
```

<style>
#crocks-helpers h2 { color: var(--primary); }
#crocks-helpers pre { font-size: 70%; }
</style>
