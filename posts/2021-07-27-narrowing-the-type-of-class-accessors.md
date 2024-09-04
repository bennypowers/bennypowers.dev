---
title: Narrowing the Type of Class Accessors
published: true
tldr: Try using decorators to narrow the type of JavaScript subclass accessors
tags:
  - typescript
  - javascript
---

Javascript [class accessors][accessors] let you define a function to get or set
a particular value on an object.

Why would you want to do that? One popular reason is to run "side effects" in a
setter. So for example say you want to make an HTTP request every time a user
sets the `options` property on your object:
 
```ts
class Fetcher {
  constructor(public url = '/api', options?: RequestInit) {
    this.#options = options;
  }

  #options?: RequestInit;

  get options(): RequestInit {
    return this.#options;
  }

  set options(val: RequestInit) {
    this.#options = val;
    this.fetch();
  }

  fetch() {
    return fetch(this.url, this.options);
  }
}
```

By defining the `options` property with an accessor pair, we can run our side
effects (in this case, calling `fetch`) in the setter.

But now let's say we want to write a `Poster` class that only makes POST
requests. It makes sense to extend Fetcher so that we don't duplicate our work.
We want to _narrow the type_ of options, however, to only allow options where
the `method` is `POST`:

```ts
type PostInit = RequestInit & { method: 'POST' };

class Poster extends Fetcher {
  declare options: PostInit;
}
```

What we're essentially saying with the `declare` keyword is "This class is
exactly the same as it's parent, except that TypeScript should limit the
options property to only accept PostInit objects". This _should_ work, but...

> 'options' is defined as an accessor in class 'Fetcher', but is overridden
> here in 'Poster' as an instance property.

Oops! TypeScript complains. This [change was introduced in 2020][tsdefine] in
order to make TypeScript behave more like plain JavaScript. Indeed, TC39
decreed that [class fields should have "define semantics"][define] instead of
"set semantics", which means that if we merely stripped these files of
typescript syntax, our Poster class would break.

The debate over TC39's decision to use define semantics continues (even though
the decision was made already), so we won't get deeper into it here, but when
using typescript and "ambient declarations" like we did above with the
`declare` keyword, we don't have the problem of our class field overriding the
accessors, particularly if we don't have `useDefineForClassFields` turned on
(which is probably a good choice anyways).

In fact, one of the three proposals which aim to fix this behaviour in
typescript calls to allow fields to override accessors if they use the
`declare` keyword.

But until that proposal, or a similar fix, is accepted, what can we do?

## A Workaround Using Decorators

TypeScript field decorators have access to the class prototype. We can use one
then to define our property with get and set functions. Since we're using a
class private field for storage, and those are only available within a class
body, let's define our decorator as a static method:

```ts
class Fetcher {
  /** @internal */
  static private o(proto: Fetcher, _: string) {
    Object.defineProperty(proto, 'options', {
      get() {
        return this.#options;
      },

      set(val) {
        this.#options = val;
        this.fetch();
      },
    });
  }

  #options?: RequestInit;

  @Fetcher.o options: RequestInit;

  constructor(public url = '/api', options?: RequestInit) {
    this.#options = options;
  }

  fetch() {
    return fetch(this.url, this.options);
  }
}
```

If you squint, you can still see the original outline of the class, and this
version does not error when we `declare` our narrow type on the subclass.

Really, this is a (kind of ugly) loophole to tide us over until TypeScript
decides which proposal (if any) to adopt for this pattern. Here's hoping they
don't close it before then.

## Footnotes

Eagle-eyed readers might object to my example: 

> `Poster` should implement it's own setter to only allow `POST` at run time!

They'd be right to do so. We could come up with other examples where the
options object doesn't have runtime validation, or where that validation is
done in other methods. In those cases, it would be right-handy to declare the
narrower type on the subclass.

[accessors]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
[define]: https://github.com/tc39/proposal-class-fields#public-fields-created-with-objectdefineproperty
[tsdefine]: https://github.com/microsoft/TypeScript/pull/37894
