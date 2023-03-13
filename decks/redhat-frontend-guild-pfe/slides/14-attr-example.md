## Document Object Model {slot=heading}

### Attributes and Properties

Some attributes are paired with corresponding DOM properties
- `element.id` _reflects_ to the `id` attribute
- `element.setAttribute('id')` sets the `id` property
- `input.value` _does not reflect_ to the value attribute
- `input.setAttribute('value')` _does not set_ the value property

<label>Sample Input <input></label>
