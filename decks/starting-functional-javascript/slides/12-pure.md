---
attrs:
    id: pure-functions-about
    fade-in:
    darken-background: 0.7
    background: ./images/red-heifer.jpg
reveal: pre
---

Pure functions are *useless*, *easily tested*
, and *referentially transparent*. {line-height="2"}

```js
const add = (x, y) => x + y

add(2, 3) === 5;

source.replace('add(2, 3)', '5');
```

