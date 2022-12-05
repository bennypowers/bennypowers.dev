## Semantic HTML {slot="heading"}

❌ Don't add interactivity to `<div>`

```html
<div onclick="sendMessageToServer()">Submit</div>
```

✅ Do use the correct semantic element

```html
<button type="submit"
        onclick="sendMessageToServer()"></button>
```
