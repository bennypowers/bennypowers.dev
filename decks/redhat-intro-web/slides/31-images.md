---
reveal: pre:nth-of-type(2)
---
## Embedded Content {slot=heading}

The `<img>` element embeds an image in the page. It must have an `alt` attribute 
that describes its contents, unless solely for decoration. It's a **void** 
element with no content. Use `loading="lazy"` to defer loading the image.

<div class="revealer">

```html
<img alt="" src="flourish.png">
<img alt="Children playing in the sun"
     loading="lazy"
     src="playground.jpg">
```

```html
<img role="presentation" src="flourish.png">
<img alt="Children playing in the sun"
     loading="lazy"
     src="playground.jpg">
```

</div>
