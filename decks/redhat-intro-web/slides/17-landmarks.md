---
class: smaller-syntax
reveal: pre
---
## What is HTML? {slot=heading}

### Landmarks

<div class="revealer">

**Landmark** elements define the **large-scale structure** of the page

- `<main>` for the main content
- `<header>` for banners, titles, etc.
- `<footer>` for content which comes after the main
- `<aside>` for content which diverges from the main flow

{% rhalert %}
All page content *must* be contained within a landmark.
{% endrhalert %}

```html
<header>
  <h1>Page Structure Matters</h1>
</header>
<main>
  <p>Body content lives in landmarks</p>
</main>
<aside>
  <p>This also helps SEO</p>
</aside>
<footer>
  <p>And creates accessible web pages</p>
</footer>
```

</div>
