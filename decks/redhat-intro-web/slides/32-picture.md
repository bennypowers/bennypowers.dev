## Embedded Content {slot=heading}

### Picture

The `<picture>` element allows more control over which images to load. **Art 
direction** is the process of loading different images depending on client 
conditions.

```html
<picture>
  <source srcset="shire-night.png"
          media="(prefers-color-scheme: dark)">
  <img alt="The Shire, a peaceful, verdant village"
       src="shire-day.png">
</picture>
```
