---
class: smaller-syntax
reveal: .revealer > :not(:first-child)
---
## What is JavaScript? {slot=heading}

### Functions

JavaScript functions are **first-class**: they are value expressions like any 
other. They're also objects, like everything else in JS.

<div class="revealer">

```js
function inc(x) { return x + 1; }
const double = x => x * 2;
const pow = exp => x => x ** exp;

inc.call(null, 3);     // 4
[1, 2, 3].map(inc);    // => [2, 3, 4]
[1, 2, 3].map(double); // => [2, 4, 6]
[1, 2, 3].map(pow(2)); // => [1, 4, 9]
```

```js
async function getJSON(url) {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch {
    throw new Error('Could not fetch');
  }
}
```

```js
function* iterInts() {
  let state = -1;
  while(true)
    yield state++;
}

for (const int of iterInts()) {
  if (int < 100) console.log(int);
  else break;
}
```

</div>
