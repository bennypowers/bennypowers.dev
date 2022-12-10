---
reveal: .revealer > :not(:first-child)
---
## What is JavaScript? {slot=heading}

### Iteration

<div class="revealer">

```js
while (bool) {
  // ...
}

do {
  // ...
} while (bool)
```

```js
for (let i = 1; i <= 100; i++) {
  // ...
}

for (const item of iterator) {
  // ...
}
```

```js
Object.keys({ hello: 'world' });    // ['hello']
Object.values({ hello: 'world' });  // ['world']
Object.entries({ hello: 'world' }); // [['hello', 'world']]

Object.fromEntries(
  Object.entries({ hello: 'world' })
    .map(([ key, value ]) =>
      [translate(key), translate(value)])
); // { bonjour: 'le monde' }
```
</div>
