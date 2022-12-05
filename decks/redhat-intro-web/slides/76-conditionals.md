---
class: smaller-syntax
---
## What is JavaScript? {slot=heading}

### Conditionals

<div style="display: flex;gap: 1em;flex-flow:row wrap;">

```js
if (key === 'A')
  return 1;
else if (key === 'B')
  return 2;
else
  return 3;
```

```js
switch (key) {
  case 'A': return 1;
  case 'B': return 2;
  default: return 3;
}
```

```js
return key === 'A' ? 1
     : key === 'B' ? 2
     : 3;
```


</div>
