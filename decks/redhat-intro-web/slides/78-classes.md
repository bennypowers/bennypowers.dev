---
class: smaller-syntax
---
## What is JavaScript? {slot=heading}

### Classes

```js
class Car extends Vehicle {
  static wheels = 4;
  #locked = false;
  get locked() { return this.#locked; }
  set locked(value) { this.#locked = this.#childLocked || value; }
  constructor(doors) {
    super();
    this.doors = doors;
  }
  drive() { /* ... */ }
}
```

Not copies - prototype links {slot=notes}
