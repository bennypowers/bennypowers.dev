---
reveal: pre
---
## Components

- Combine sequential `pattern_character`s
- Track capture groups and nesting levels
- Translate control chars / quantifiers
- Try to handle negative lookbehinds

```json
{
  "regexp_string": "hello d([0-9]|o)lly",
  "components": [{
      "text": "hello d",
      "type": "pattern_character"
    }, {
      "capture_group": 1,
      "depth": 1,
      "text": "([0-9]|o)",
      "type": "anonymous_capturing_group",
      "children": [{
        "text": "[0-9]|o",
        "type": "alternation",
        "children": [{
          "text": "[0-9]",
          "type": "term",
          "children": [{
            "text": "0-9",
            "type": "class_range"
          }],
        }, {
          "text": "o",
          "type": "pattern_character"
        }],
      }],
    }, {
      "text": "lly",
      "type": "pattern_character"
  }]
}
```
