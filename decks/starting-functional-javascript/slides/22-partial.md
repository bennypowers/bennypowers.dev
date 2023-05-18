---
attrs:
    id: partial-application
    fade-in:
    darken-background: 0.5
    background: ./images/curry.jpg
reveal: pre
---
## Partial Application
Use closure to defer computation.

```js
const add2 = add(2)
```

```js
add2(3) === 5

add2(4) === 6
```

Partial application has many uses e.g. generic functions or fluent computations.

<style>
#partial-application {
    & h2 {
        text-transform: uppercase;
        color: var(--primary)
    }
    & p {
        color: white;
    }
}
</style>
