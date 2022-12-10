---
class: smaller-syntax
reveal: .revealer > :not(:first-child)
---
## What is JavaScript? {slot=heading}

### Variables

![venn diagram: var and let are reassignable, let and const are 
block-scoped](var-venn.svg)
JavaScript variables are declared with `var`, `let`, or `const`.
Primitive types (`string`, `number`, `boolean`) equate by value.
Object types are assigned and compared by *reference*, not by value.

<div class="revealer">

```js
assert(1 === 1);                    // ✅
assert('RedHat' === 'RedHat');      // ✅
assert(true === true);              // ✅
```

```js
const obj = { hello: 'world' };
assert(obj === obj);                // ✅
assert(obj === { hello: 'world' }); // ❌
```

```js
const obj = { hello: 'world' };
      obj = { shalom: 'haver' };
      // => TypeError: invalid assignment to const 'obj'

obj.shalom = 'haver';
console.log(obj);
// => { hello: 'world', shalom: 'haver' }
```

</div>
