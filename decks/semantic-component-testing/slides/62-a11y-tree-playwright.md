## The Accessibility Tree - Playwright

- Playwright provides access to the browser's AX Tree
- It's not perfect, but it provides lots of info
{slot="notes"}

```json
{
  "role": "WebArea",
  "name": "",
  "children": [{
    "role": "combobox",
    "name": "options",
    "expanded": true,
    "focused": true,
    "autocomplete": "both",
    "haspopup": "listbox"
  }, {
    "role": "button",
    "name": "options",
    "expanded": true
  }, {
    "role": "listbox",
    "name": "options",
    "orientation": "vertical",
    "children": [{
      "role": "option",
      "name": "Select an Option",
      "disabled": true
    }, {
      "role": "option",
      "name": "1"
    }, {
      "role": "option",
      "name": "2"
    }, {
      "role": "option",
      "name": "3"
    }, {
      "role": "option",
      "name": "4"
    }, {
      "role": "option",
      "name": "5"
    }, {
      "role": "option",
      "name": "6"
    }, {
      "role": "option",
      "name": "7"
    }, {
      "role": "option",
      "name": "8"
    }, {
      "role": "option",
      "name": "9"
    }, {
      "role": "option",
      "name": "10"
    }]
  }]
}
