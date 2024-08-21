## Semantic Assertions

Instead of asserting on the state of the DOM,
or on the state of the visual renderer,
assert on the state of the accessibility tree
{slot=notes}

```diff-json
 {
   "role": "combobox",
   "name": "options",
-  "expanded": false,
+  "expanded": true,
   "focused": true,
   "autocomplete": "both",
   "haspopup": "listbox"
 }
```
