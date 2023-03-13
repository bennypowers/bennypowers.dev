---
class: smaller-syntax
reveal: pre
---
## Libraries and Ecosystem {slot=heading}

## Haunted

React-like hooks, but it's web components

```ts
import { html } from 'lit';
import { component, useState } from 'haunted';

function Counter() {
  const [count, setCount] = useState(0);

  return html`
    <div part="count">${count}</div>
    <button part="button" @click=${() => setCount(count + 1)}>
      Increment
    </button>
  `;
}

customElements.define('my-counter', component(Counter));
```
