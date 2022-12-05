---
class: smaller-syntax
style:
  font-size: 80%
---
## HTML Forms {slot=heading}

HTML Forms work without, and in fact *predate* JavaScript. Web apps don't need 
JS to provide interactive experiences & *should* provide fallbacks when JS is 
unavailable.

```html
<form id="searchForm" action="/search">
  <label>🔍 <input name="query" type="search"></label>
  <button>Search</search>
</form>

<script>
  searchForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const results = await fetch('/search', {
      body: new FormData(this),
      method: 'post',
    });
  });
</script>
```
