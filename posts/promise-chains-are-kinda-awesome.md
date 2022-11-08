---
title: Promise Chains are Kinda Awesome
description: Some say that promises shouldn't be used when async await is available but that's not always true. Here's why 'promise chains' are actually amazing.
published: true
datePublished: 2019-12-13
tags:
  - promise
  - async
  - functional programming
  - javascript
---

Oh you came here for the promises? Yeah we'll get to that in a second, but
first let me introduce you to a buddy of mine called Trace

```js
const trace = tag => x =>
  console.log(tag, x) || x;
```

We met at this [@drBoolean](https://github.com/DrBoolean) jam a few years
back and sorta hit it off. I realised we have a lot in common: we both
have a strong sense of identity, but are not afraid to effect a little
change on the side when called for. Kid makes a mean curry too.

```haskell
trace :: Show t => t -> a -> a
```

See, thing about Trace is, he doesn't mind where you put him, he's happy
just to do his own thing. Kind of goes with the flow, promise!

<figure>

```js
['a', 'b', 'c']
  .map(trace('what do we have here...'))

// what do we have here ... a
// what do we have here ... b
// what do we have here ... c
```

<figcaption>

Mapped over an Array with [`Array#Map`][array-map]

</figcaption>

</figure>

<figure>

```js
const handleAsJson = resp => resp.json()

fetch(`/users`)
  .then(handleAsJson)
  .then(trace('all users: '))

// all users: [{ id: 1, isAdmin: false }, { id: 2, isAdmin: true }]
```

<figcaption>

Mapped over a Promise with [`Promise#then`][promise-then]

</figcaption>

</figure>

Trace might seem at first glance a trifle, perhaps even frivolous. But its
simplicity underlies its power. It's the kind of simple, atomic,
single-purpose-multi-use function that handily combines into larger and larger
computations.

Anyways, I'm getting side-tracked here.

So one day, Trace and I decided to host a dinner party. We broke up the job
into a short to-do list

1. draw up the guest list
1. send out invitations
1. order ingredients
1. cook the entree
1. serve dinner

```js
const handleAsJson = resp => resp.json()
const map = f => xs => xs.map(f)
const all = Promise.all.bind(Promise)

const fetchGuests = () => fetch('/friends')
const fetchShoppingList = () => fetch('/shopping-list')
const order = item => fetch(`https://groceries.for.you/order/${item}`)
const invite = body => to =>
  fetch(`/sendmail?to="${encodeURIComponent(to)}`, { method: 'POST', body })

const getEmail = ({ email }) => email
const cook = xs => xs.reduce(fricassee, 'a delicious ')
const serve = dish => alert(`${dish} is served!`)
const fricassee = (a, x, i, {length}) =>
  `${a}-${x}${i === length - 1 ? ' fricassee' : ''}`

function party() {
  return fetchGuests()
    .then(handleAsJson)      // Promise<[person]>
    .then(map(getEmail))     // Promise<[string]>
    .then(map(invite))       // Promise<[Response]>
    .then(all)               // Promise<[invitation]>
    .then(fetchShoppingList) // discard previous result, as `fetchShoppingList` takes no arguments.
    .then(handleAsJson)      // Promise<[item]>
    .then(map(order))        // Promise<[Promise<order>]>
    .then(all)               // Promise<[order]>
    .then(cook)              // Promise<Fricasee>
    .then(serve)             // et voila
}
```

To me, this kind of top-to-bottom-left-to-right flow is readable and beautiful.
It only requires me to keep track of one thing at a time, namely, the function
that I pass at each `then` call.

But this flow would run afoul of VS-Code's opinion-o-matic Lightbulb of Truth™️

![Screenshot shows VS-Code error "This may be converted to an async
function.ts(80006)"][vscode-nanny])

Consider the alternative:

```js
async function party() {
  const guestsResponse = await fetchGuests()
  const guests = await guestsResponse.json()
  const emails = guests.map(getEmail)
  const inviteResponses = emails.map(invite)
  const listResponse = fetchShoppingList()
  const list = listResponse.json()
  const orderPromises = list.map(order)
  const orderResponses = Promise.all(orderPromises)
  const order = orderResponses.map(handleAsJson)
  const dish = cook(order)
  return serve(dish)
}
```

How much state, how many statements, how much mental execution will be
necessary to appease our stylistic overlords in Redmond?

## Assignment via Closure

Say you need to keep track of the users so you can serve each one individually
with respect to their dietary needs. We can do that with closure. Now's not the
time to get into confusing technical definitions of closure, for now we'll just
say that a function can access its own parameters.

```js
const all = Promise.all.bind(Promise)

const constant = x => () => x

const not = p => x => !p(x)

const fanout = (f, g) => x => [f(x), g(x)]
const merge = f => ([x, y]) => f(x, y)

const bimap = (f, g) => ([xs, ys]) => [xs.map(f), ys.map(g)]

const serve = dish => guest => alert(`${guest} has been served ${dish}!`)

function party() {
  return fetchShoppingList()
    .then(handleAsJson)
    .then(map(order))
    .then(cook)
    .then(dish => orderDietDishes() // no closing `)`, so dish stays in closure
    .then(handleAsJson)
    .then(dietDish => fetchGuests() // no closing `)`, so dietDish stays in closure
    .then(handleAsJson)
    .then(users => Promise.resolve(users)
    .then(map(getEmail))
    .then(map(invite))
    .then(all)
    .then(constant(users)))
    .then(fanout(filter(hasDiet), filter(not(hasDiet))))
    .then(merge(bimap(serve(dietDish), serve(dish)))))) // end closures from above
}
```

<aside>

*caveat*: in this contrived example, I used closures to illustrate the point,
but in real life, I might use data types from [crocks][crocks] instead of
arrays for fanning out and merging, or I might pass <abbr title="plain old
javascript objects">POJOs</abbr> to hold the state. I might even use `await`
and assign to a `const`, but I wouldn't throw the baby out with the bathwater
by unwrapping *every*. *single*. *promise*. at its call-site.

</aside>

## Summing it Up

Passing well-named, simple, composable, first-class functions leads to code
that reads like prose. Isolating stages of computation like this defers the
reader's cognitive load of mental parsing to function implementations, and that
makes your program more readable and easier to maintain.

Techniques like fanning out to tuples and merging with binary functions are
well suited to performing 'parallel' computations or to passing accumulated
state to your pure functions. Async functions have their place as well,
especially when the amount of closures gets hard to manage, but they shouldn't
replace every last `.then` call.

## Promise Me!

So promise chains are amazing, make your code more readable, and contribute to
better software, as long as you're using them in the most helpful way. Next
chance you get, tell that little lightbulb "no thank you" - compose a promise
chain in your app and enjoy self-documenting, modular code.

## Acknowledgements and Errata

A previous version demonstrated passing `Promise.all` first-class i.e.
`urls.map(fetch).then(Promise.all)` Thanks to @coagmano for pointing out that
you must bind `Promise.all` if you plan to pass it first class. Snippets here
have been updated.

User [@kosich](https://dev.to/kosich) pointed out a typo (see comments) in the
second example which has since been corrected.

[array-map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
[promise-then]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
[vscode-nanny]: https://thepracticaldev.s3.amazonaws.com/i/4frypdjyslr4jawilahx.png
[crocks]: https://crocks.dev/docs/crocks/Pair.html#fanout
