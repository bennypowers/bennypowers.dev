## Document Object Model {slot=heading}

### The DOM: Document Object Model

As the browser downloads an HTML page, it instantiates a DOM for the document.

- Every HTML element becomes an element node
- The `<html>` element becomes the root document node
- HTML Text content becomes text nodes
- Comments become comment nodes

This happens while the server *streams* HTML to the client, but `<script>` 
elements and other subresources can halt streaming DOM construction and impair 
page performance.
