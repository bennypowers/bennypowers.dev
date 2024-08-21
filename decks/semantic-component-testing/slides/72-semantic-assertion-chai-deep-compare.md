---
reveal: mark
---

## Semantic Assertions - Snapshots

Same issues as other kinds of snapshot testing
{slot=notes}

```js/3-10
describe('clicking the first button', function() {
  beforeEach(clickButton1);
  it('remains closed', async function() {
    expect(await a11ySnapshot()).to.deep.equal({
      name: '',
      role: 'WebArea',
      children: [
        { role: 'button', name: 'Toggle 1', focused: true },
        { role: 'button', name: 'Toggle 2' },
      ],
    });
  });
});
```

