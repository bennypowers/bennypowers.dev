---
title: Let's Write a Redux Controller for Web Components
published: true
date: 2022-01-07
tags:
  - javascript
  - redux
  - web components
  - lit
---

Elliott Marquez challenged me to write a redux controller on the [Lit & Friends
slack](https://lit.dev/slack-invite/). 

https://dev.to/elliott

So let's get cracking!

## Step 0: The Setup

First step let's make a new project and import some dependencies to help us
develop.

```bash
mkdir controllers
cd controllers
git init
npm init --yes
npm i -D typescript lit
touch reducer.ts
```

Ok next we'll set up the controller class in reducer.ts

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class ReducerController implements ReactiveController {
  constructor(
    public host: ReactiveControllerHost,
  ) {
    host.addController(this);
  }

  hostUpdate()?: void;
}
```

That `hostUpdate` signature is just to keep typescript from complaining. 🤷.

## Step 1: Reducers

Our controller essentially bolts some statefullness onto a function which takes
some state `T` and some action `A` and returns some other or the same state
`T`. So let's formalize that:

```ts
type Reducer<T, A> = (state: T, action: A) => T;
```

The controller should take that reducer, along with some initial state, and pin
them to the class instance.

```ts
export class ReducerController<T = unknown, A = unknown> implements ReactiveController {
  public state: T;

  constructor(
    private host: ReactiveControllerHost,
    public reducer: Reducer<T, A>,
    public initialState: T,
  ) {
    this.host.addController(this);
    this.state = initialState;
  }

  hostUpdate?():void
}
```

## Step 2: Actions

Believe it or not we're pretty much done. The last piece we need is to
implement a `dispatch` method which takes an action `A` and updates the host.

```ts
dispatch(action: A): void {
  this.state = this.reducer(this.state, action);
  this.host.requestUpdate();
}
```

And, as Chef John would say, _that's it_!

If we want to use our controller, we just create it on a compatible host (like
LitElement) and we're off to the races:

<iframe src="https://codepen.io/bennyp/embed/abLjmqW?height=600&amp;default-tab=result&amp;embed-version=2"
        scrolling="no"
        allowtransparency="true"
        loading="lazy"
        style="width: 100%;"
        height="600"
        frameborder="no"></iframe>

[Live Demo](https://lit.dev/playground/#project=W3sibmFtZSI6ImNvdW50ZXItZWxlbWVudC50cyIsImNvbnRlbnQiOiJpbXBvcnQge2h0bWwsIGNzcywgTGl0RWxlbWVudH0gZnJvbSAnbGl0JztcbmltcG9ydCB7Y3VzdG9tRWxlbWVudCwgcHJvcGVydHl9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcbmltcG9ydCB7UmVkdWNlckNvbnRyb2xsZXJ9IGZyb20gJy4vcmVkdWNlci5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCdjb3VudGVyLWVsZW1lbnQnKVxuZXhwb3J0IGNsYXNzIENvdW50ZXJFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIHByaXZhdGUgY291bnQgPSBuZXcgUmVkdWNlckNvbnRyb2xsZXIodGhpcywgZnVuY3Rpb24gcmVkdWNlcihzdGF0ZSwgYWN0aW9uOiBDb3VudEFjdGlvbikge1xuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3Jlc2V0JzpcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICBjYXNlICdpbmNyZW1lbnQnOlxuICAgICAgICByZXR1cm4gc3RhdGUgKyAxO1xuICAgICAgY2FzZSAnZGVjcmVtZW50JzpcbiAgICAgICAgcmV0dXJuIHN0YXRlIC0gMTtcbiAgICB9XG4gIH0sIDApO1xuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gaHRtbGBcbiAgICAgIDxidXR0b24gQGNsaWNrPSR7KCkgPT4gdGhpcy5jb3VudC5kaXNwYXRjaCh7IHR5cGU6ICdpbmNyZW1lbnQnIH0pfT4rPC9idXR0b24-XG4gICAgICA8b3V0cHV0PiR7dGhpcy5jb3VudC5zdGF0ZX08L291dHB1dD5cbiAgICAgIDxidXR0b24gQGNsaWNrPSR7KCkgPT4gdGhpcy5jb3VudC5kaXNwYXRjaCh7IHR5cGU6ICdkZWNyZW1lbnQnIH0pfT4rPC9idXR0b24-XG4gICAgYDtcbiAgfVxufVxuIn0seyJuYW1lIjoiaW5kZXguaHRtbCIsImNvbnRlbnQiOiI8IURPQ1RZUEUgaHRtbD5cbjxoZWFkPlxuICA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIuL3NpbXBsZS1ncmVldGluZy5qc1wiPjwvc2NyaXB0PlxuPC9oZWFkPlxuPGJvZHk-XG4gIDxjb3VudGVyLWVsZW1lbnQ-PC9jb3VudGVyLWVsZW1lbnQ-XG48L2JvZHk-XG4ifSx7Im5hbWUiOiJwYWNrYWdlLmpzb24iLCJjb250ZW50Ijoie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsaXRcIjogXCJeMi4wLjBcIixcbiAgICBcIkBsaXQvcmVhY3RpdmUtZWxlbWVudFwiOiBcIl4xLjAuMFwiLFxuICAgIFwibGl0LWVsZW1lbnRcIjogXCJeMy4wLjBcIixcbiAgICBcImxpdC1odG1sXCI6IFwiXjIuMC4wXCJcbiAgfVxufSIsImhpZGRlbiI6dHJ1ZX0seyJuYW1lIjoicmVkdWNlci50cyIsImNvbnRlbnQiOiJpbXBvcnQgdHlwZSB7IFJlYWN0aXZlQ29udHJvbGxlciwgUmVhY3RpdmVDb250cm9sbGVySG9zdCB9IGZyb20gJ2xpdCc7XG5cbmV4cG9ydCB0eXBlIFJlZHVjZXI8VCwgQT4gPSAoc3RhdGU6IFQsIGFjdGlvbjogQSkgPT4gVDtcblxuZXhwb3J0IGNsYXNzIFJlZHVjZXJDb250cm9sbGVyPFQgPSB1bmtub3duLCBBID0gdW5rbm93bj4gaW1wbGVtZW50cyBSZWFjdGl2ZUNvbnRyb2xsZXIge1xuICBwdWJsaWMgc3RhdGU6IFQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBob3N0OiBSZWFjdGl2ZUNvbnRyb2xsZXJIb3N0LFxuICAgIHB1YmxpYyByZWR1Y2VyOiBSZWR1Y2VyPFQsIEE-LFxuICAgIHB1YmxpYyBpbml0aWFsU3RhdGU6IFQsXG4gICkge1xuICAgIHRoaXMuaG9zdC5hZGRDb250cm9sbGVyKHRoaXMpO1xuICAgIHRoaXMuc3RhdGUgPSBpbml0aWFsU3RhdGU7XG4gIH1cblxuICBkaXNwYXRjaChhY3Rpb246IEEpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXRlID0gdGhpcy5yZWR1Y2VyKHRoaXMuc3RhdGUsIGFjdGlvbik7XG4gICAgdGhpcy5ob3N0LnJlcXVlc3RVcGRhdGUoKTtcbiAgfVxuXG4gIGhvc3RVcGRhdGU_KCk6dm9pZFxufVxuIn1d)

