---
attrs:
    id: pure-functions
    fade-in:
    darken-background: 0.7
    background: ./images/red-heifer.jpg
reveal: pre
---
Functions that have no *side effects* are said to be pure.

*Which of these functions is pure?*

```js
const add = (x, y) => x + y
```
```js
const trace = (tag, x) => console.log(tag, x) ?? x
```
```js
const getTime = () => Date.now()
```
```js
const resolveUser = ({ token }, models) =>
  models.user.isValidToken(token)
    ?       () => models.user.fetch(token)
    : async () => null
```

<style>
#pure-functions pre {
    font-size: 80%;
}
</style>
