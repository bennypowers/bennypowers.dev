---
attrs:
    id: curried-functions
    fade-in:
    darken-background: 0.5
    background: ./images/curry.jpg
---
<h2 uppercase color="--primary">Curried Functions</h2>
<p color="white">Take their arguments one at a time.</p>

```js
const add = x => y => x + y
```

```js
function add(x) {
  return function addToX(y) {
    return x + y;
  }
}
```

