---
class: sidebar
---
## Making PatternFly Elements {slot=title}

```ts
@customElement('pf-tile')
export class PfTile extends BaseTile {
  @property({ reflect: true, type: Boolean }) selected = false;
  @property({ reflect: true }) stacked?: StackedSize;

  render() {
    const { stacked } = this;
    return html`
      <div part="header" class="${classMap({ stacked })}">
        <slot id="icon" name="icon" part="icon"></slot>
        <slot id="title" name="title" part="title"></slot>
      </div>
      <slot id="body" part="body"></slot>
    `;
  }
}
```

<style>
pre {
  font-size: 90%;
}
</style>
