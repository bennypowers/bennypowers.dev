## Document Object Model {slot=heading}

### Event Listeners

```js
document.querySelector('canvas')
  .addEventListener('mousemove', function(event) {
    const ctx = this.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(event.clientX, event.clientY, 2, 2);
  });
```
