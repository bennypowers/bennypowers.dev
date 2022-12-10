---
class: smaller-syntax
style:
  font-size: 75%
---
## Semantic HTML {slot="heading"}

### Disclosure Widgets

HTML is enough to write entire apps. `<details>` and `<summary>` can hide or 
show content by activating the disclosure widget. Add the `open` boolean 
attribute to make them open by default.

<details><summary>for example...</summary>

```html
<details open>
  <summary>Hide details</summary>
  <dl>
    <dt>Height</dt> <dd>1.2m</dd>
    <dt>Weight</dt> <dd>150kg</dd>
    <dt>Hair Colour</dt> <dd>Brown</dd>
  </dl>
</details>
```

</details>
