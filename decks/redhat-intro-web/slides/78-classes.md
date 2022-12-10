---
class: smaller-syntax
reveal: pre, .revealer > p
---
## What is JavaScript? {slot=heading}

### Classes

<div class="revealer">

- Familiar OOP syntax and concepts
- Maps well to <abbr title="document object model">DOM</abbr>
- Powerful and growing feature set

```js
class Car extends Vehicle {
  static wheels = 4;

  #locked = false;
  #childLockEngaged = false;

  get locked() { return this.#locked; }
  set locked(value) {
    if (!this.#childLockEngaged)
      this.#locked = value;
  }

  constructor(doors = 2) {
    super();
    this.doors = doors;
  }
}
```

```js
const car = new Car();
      car.drive();

assert(car instanceof Vehicle);
console.log(car.constructor)                     // class Car {...}

'drive' in Object.getPrototypeOf(car);           // true
'drive' in Object.getPrototypeOf(new Vehicle()); // true
```

![firefox dev tools prototype chain](prototypes.png)

</div>

Not copies - prototype links {slot=notes}
