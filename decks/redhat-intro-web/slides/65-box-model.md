---
reveal: img
---
## What is CSS? {slot=heading}

### Box Model

CSS' box model defines elements' dimensions and positions in terms of 
surrounding boxes. Boxes' dimensions are composed of **margin** separating it 
from other boxes, a **border** surrounding itself, **padding** separating 
content from the border, and the **content** itself.

Boxes can have one of two "outer display types", which determine how the browser 
lays them out on the page. **Block** elements break onto a new line and have 
margins, border, and padding which push other elements away. **Inline** elements 
do not break onto a new line and their blockwise box properties do not push away 
other elements.

![screenshot from firefox' box model developer tools](box-model.png) 
{style="position:fixed;inset:50% auto auto 50%;translate:-50% -50%"}
