---
reveal: mark
reveal-kind: together
---

## Semantic Assertions - Mocha / Chai

```js/3-4,7-9
describe('click combobox button', function() {
  beforeEach(() => clickElementAtCenter(element));
  it('expands the listbox', async function() {
    expect(await a11ySnapshot())
      .to.axContainRole('listbox');
  });
  it('focuses on the first item', async function() {
    expect(await a11ySnapshot())
      .axTreeFocusedNode
      .to.have.axName('1');
  });
});
```

