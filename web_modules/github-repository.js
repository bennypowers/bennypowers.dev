/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// The first argument to JS template tags retain identity across multiple
// calls to a tag for the same literal, so we can cache work done per literal
// in a Map.
const templateCaches = new Map();
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, partCallback = defaultPartCallback) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.partCallback = partCallback;
    }
    /**
     * Returns a string of HTML used to create a <template> element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isTextBinding = true;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            html += s;
            // We're in a text position if the previous string closed its tags.
            // If it doesn't have any tags, then we use the previous text position
            // state.
            const closing = findTagClose(s);
            isTextBinding = closing > -1 ? closing < s.length : isTextBinding;
            html += isTextBinding ? nodeMarker : marker;
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
    }
}
/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTMl in an <svg> tag in order to parse its contents in the
 * SVG namespace, then modifies the template to remove the <svg> tag so that
 * clones only container the original fragment.
 */
class SVGTemplateResult extends TemplateResult {
    getHTML() {
        return `<svg>${super.getHTML()}</svg>`;
    }
    getTemplateElement() {
        const template = super.getTemplateElement();
        const content = template.content;
        const svgElement = content.firstChild;
        content.removeChild(svgElement);
        reparentNodes(content, svgElement.firstChild);
        return template;
    }
}
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, not attribute positions,
 * in template.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;
/**
 * Finds the closing index of the last closed HTML tag.
 * This has 3 possible return values:
 *   - `-1`, meaning there is no tag in str.
 *   - `string.length`, meaning the last opened tag is unclosed.
 *   - Some positive number < str.length, meaning the index of the closing '>'.
 */
function findTagClose(str) {
    const close = str.lastIndexOf('>');
    const open = str.indexOf('<', close + 1);
    return open > -1 ? str.length : close;
}
/**
 * A placeholder for a dynamic expression in an HTML template.
 *
 * There are two built-in part types: AttributePart and NodePart. NodeParts
 * always represent a single dynamic expression, while AttributeParts may
 * represent as many expressions are contained in the attribute.
 *
 * A Template's parts are mutable, so parts can be replaced or modified
 * (possibly to implement different template semantics). The contract is that
 * parts can only be replaced, not removed, added or reordered, and parts must
 * always consume the correct number of values in their `update()` method.
 *
 * TODO(justinfagnani): That requirement is a little fragile. A
 * TemplateInstance could instead be more careful about which values it gives
 * to Part.update().
 */
class TemplatePart {
    constructor(type, index, name, rawName, strings) {
        this.type = type;
        this.index = index;
        this.name = name;
        this.rawName = rawName;
        this.strings = strings;
    }
}
const isTemplatePartActive = (part) => part.index !== -1;
/**
 * An updateable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const content = this.element.content;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
               NodeFilter.SHOW_TEXT */, null, false);
        let index = -1;
        let partIndex = 0;
        const nodesToRemove = [];
        // The actual previous node, accounting for removals: if a node is removed
        // it will never be the previousNode.
        let previousNode;
        // Used to set previousNode at the top of the loop.
        let currentNode;
        while (walker.nextNode()) {
            index++;
            previousNode = currentNode;
            const node = currentNode = walker.currentNode;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (!node.hasAttributes()) {
                    continue;
                }
                const attributes = node.attributes;
                // Per https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                // attributes are not guaranteed to be returned in document order. In
                // particular, Edge/IE can return them out of order, so we cannot assume
                // a correspondance between part index and attribute index.
                let count = 0;
                for (let i = 0; i < attributes.length; i++) {
                    if (attributes[i].value.indexOf(marker) >= 0) {
                        count++;
                    }
                }
                while (count-- > 0) {
                    // Get the template literal section leading up to the first
                    // expression in this attribute
                    const stringForPart = result.strings[partIndex];
                    // Find the attribute name
                    const attributeNameInPart = lastAttributeNameRegex.exec(stringForPart)[1];
                    // Find the corresponding attribute
                    // TODO(justinfagnani): remove non-null assertion
                    const attribute = attributes.getNamedItem(attributeNameInPart);
                    const stringsForAttributeValue = attribute.value.split(markerRegex);
                    this.parts.push(new TemplatePart('attribute', index, attribute.name, attributeNameInPart, stringsForAttributeValue));
                    node.removeAttribute(attribute.name);
                    partIndex += stringsForAttributeValue.length - 1;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const nodeValue = node.nodeValue;
                if (nodeValue.indexOf(marker) < 0) {
                    continue;
                }
                const parent = node.parentNode;
                const strings = nodeValue.split(markerRegex);
                const lastIndex = strings.length - 1;
                // We have a part for each match found
                partIndex += lastIndex;
                // Generate a new text node for each literal section
                // These nodes are also used as the markers for node parts
                for (let i = 0; i < lastIndex; i++) {
                    parent.insertBefore((strings[i] === '')
                        ? document.createComment('')
                        : document.createTextNode(strings[i]), node);
                    this.parts.push(new TemplatePart('node', index++));
                }
                parent.insertBefore(strings[lastIndex] === '' ?
                    document.createComment('') :
                    document.createTextNode(strings[lastIndex]), node);
                nodesToRemove.push(node);
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */ &&
                node.nodeValue === marker) {
                const parent = node.parentNode;
                // Add a new marker node to be the startNode of the Part if any of the
                // following are true:
                //  * We don't have a previousSibling
                //  * previousSibling is being removed (thus it's not the
                //    `previousNode`)
                //  * previousSibling is not a Text node
                //
                // TODO(justinfagnani): We should be able to use the previousNode here
                // as the marker node and reduce the number of extra nodes we add to a
                // template. See https://github.com/PolymerLabs/lit-html/issues/147
                const previousSibling = node.previousSibling;
                if (previousSibling === null || previousSibling !== previousNode ||
                    previousSibling.nodeType !== Node.TEXT_NODE) {
                    parent.insertBefore(document.createComment(''), node);
                }
                else {
                    index--;
                }
                this.parts.push(new TemplatePart('node', index++));
                nodesToRemove.push(node);
                // If we don't have a nextSibling add a marker node.
                // We don't have to check if the next node is going to be removed,
                // because that node will induce a new marker if so.
                if (node.nextSibling === null) {
                    parent.insertBefore(document.createComment(''), node);
                }
                else {
                    index--;
                }
                currentNode = previousNode;
                partIndex++;
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
/**
 * Returns a value ready to be inserted into a Part from a user-provided value.
 *
 * If the user value is a directive, this invokes the directive with the given
 * part. If the value is null, it's converted to undefined to work better
 * with certain DOM APIs, like textContent.
 */
const getValue = (part, value) => {
    // `null` as the value of a Text node will render the string 'null'
    // so we convert it to undefined
    if (isDirective(value)) {
        value = value(part);
        return noChange;
    }
    return value === null ? undefined : value;
};
const isDirective = (o) => typeof o === 'function' && o.__litDirective === true;
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
const isPrimitiveValue = (value) => value === null ||
    !(typeof value === 'object' || typeof value === 'function');
class AttributePart {
    constructor(instance, element, name, strings) {
        this.instance = instance;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.size = strings.length - 1;
        this._previousValues = [];
    }
    _interpolate(values, startIndex) {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const v = getValue(this, values[startIndex + i]);
            if (v && v !== noChange &&
                (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
                for (const t of v) {
                    // TODO: we need to recursively call getValue into iterables...
                    text += t;
                }
            }
            else {
                text += v;
            }
        }
        return text + strings[l];
    }
    _equalToPreviousValues(values, startIndex) {
        for (let i = startIndex; i < startIndex + this.size; i++) {
            if (this._previousValues[i] !== values[i] ||
                !isPrimitiveValue(values[i])) {
                return false;
            }
        }
        return true;
    }
    setValue(values, startIndex) {
        if (this._equalToPreviousValues(values, startIndex)) {
            return;
        }
        const s = this.strings;
        let value;
        if (s.length === 2 && s[0] === '' && s[1] === '') {
            // An expression that occupies the whole attribute value will leave
            // leading and trailing empty strings.
            value = getValue(this, values[startIndex]);
            if (Array.isArray(value)) {
                value = value.join('');
            }
        }
        else {
            value = this._interpolate(values, startIndex);
        }
        if (value !== noChange) {
            this.element.setAttribute(this.name, value);
        }
        this._previousValues = values;
    }
}
class NodePart {
    constructor(instance, startNode, endNode) {
        this.instance = instance;
        this.startNode = startNode;
        this.endNode = endNode;
        this._previousValue = undefined;
    }
    setValue(value) {
        value = getValue(this, value);
        if (value === noChange) {
            return;
        }
        if (isPrimitiveValue(value)) {
            // Handle primitive values
            // If the value didn't change, do nothing
            if (value === this._previousValue) {
                return;
            }
            this._setText(value);
        }
        else if (value instanceof TemplateResult) {
            this._setTemplateResult(value);
        }
        else if (Array.isArray(value) || value[Symbol.iterator]) {
            this._setIterable(value);
        }
        else if (value instanceof Node) {
            this._setNode(value);
        }
        else if (value.then !== undefined) {
            this._setPromise(value);
        }
        else {
            // Fallback, will render the string representation
            this._setText(value);
        }
    }
    _insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    _setNode(value) {
        if (this._previousValue === value) {
            return;
        }
        this.clear();
        this._insert(value);
        this._previousValue = value;
    }
    _setText(value) {
        const node = this.startNode.nextSibling;
        value = value === undefined ? '' : value;
        if (node === this.endNode.previousSibling &&
            node.nodeType === Node.TEXT_NODE) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if _previousValue is
            // primitive?
            node.textContent = value;
        }
        else {
            this._setNode(document.createTextNode(value));
        }
        this._previousValue = value;
    }
    _setTemplateResult(value) {
        const template = this.instance._getTemplate(value);
        let instance;
        if (this._previousValue && this._previousValue.template === template) {
            instance = this._previousValue;
        }
        else {
            instance = new TemplateInstance(template, this.instance._partCallback, this.instance._getTemplate);
            this._setNode(instance._clone());
            this._previousValue = instance;
        }
        instance.update(value.values);
    }
    _setIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _previousValue is an array, then the previous render was of an
        // iterable and _previousValue will contain the NodeParts from the previous
        // render. If _previousValue is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this._previousValue)) {
            this.clear();
            this._previousValue = [];
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this._previousValue;
        let partIndex = 0;
        for (const item of value) {
            // Try to reuse an existing part
            let itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                // If we're creating the first item part, it's startNode should be the
                // container's startNode
                let itemStart = this.startNode;
                // If we're not creating the first part, create a new separator marker
                // node, and fix up the previous part's endNode to point to it
                if (partIndex > 0) {
                    const previousPart = itemParts[partIndex - 1];
                    itemStart = previousPart.endNode = document.createTextNode('');
                    this._insert(itemStart);
                }
                itemPart = new NodePart(this.instance, itemStart, this.endNode);
                itemParts.push(itemPart);
            }
            itemPart.setValue(item);
            partIndex++;
        }
        if (partIndex === 0) {
            this.clear();
            this._previousValue = undefined;
        }
        else if (partIndex < itemParts.length) {
            const lastPart = itemParts[partIndex - 1];
            // Truncate the parts array so _previousValue reflects the current state
            itemParts.length = partIndex;
            this.clear(lastPart.endNode.previousSibling);
            lastPart.endNode = this.endNode;
        }
    }
    _setPromise(value) {
        this._previousValue = value;
        value.then((v) => {
            if (this._previousValue === value) {
                this.setValue(v);
            }
        });
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
const defaultPartCallback = (instance, templatePart, node) => {
    if (templatePart.type === 'attribute') {
        return new AttributePart(instance, node, templatePart.name, templatePart.strings);
    }
    else if (templatePart.type === 'node') {
        return new NodePart(instance, node, node.nextSibling);
    }
    throw new Error(`Unknown part type ${templatePart.type}`);
};
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, partCallback, getTemplate) {
        this._parts = [];
        this.template = template;
        this._partCallback = partCallback;
        this._getTemplate = getTemplate;
    }
    update(values) {
        let valueIndex = 0;
        for (const part of this._parts) {
            if (!part) {
                valueIndex++;
            }
            else if (part.size === undefined) {
                part.setValue(values[valueIndex]);
                valueIndex++;
            }
            else {
                part.setValue(values, valueIndex);
                valueIndex += part.size;
            }
        }
    }
    _clone() {
        // Clone the node, rather than importing it, to keep the fragment in the
        // template's document. This leaves the fragment inert so custom elements
        // won't upgrade until after the main document adopts the node.
        const fragment = this.template.element.content.cloneNode(true);
        const parts = this.template.parts;
        if (parts.length > 0) {
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
            // null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                   NodeFilter.SHOW_TEXT */, null, false);
            let index = -1;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const partActive = isTemplatePartActive(part);
                // An inactive part has no coresponding Template node.
                if (partActive) {
                    while (index < part.index) {
                        index++;
                        walker.nextNode();
                    }
                }
                this._parts.push(partActive ? this._partCallback(this, part, walker.currentNode) : undefined);
            }
        }
        return fragment;
    }
}
/**
 * Reparents nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), into another container (could be the same container), before
 * `beforeNode`. If `beforeNode` is null, it appends the nodes to the
 * container.
 */
const reparentNodes = (container, start, end = null, before = null) => {
    let node = start;
    while (node !== end) {
        const n = node.nextSibling;
        container.insertBefore(node, before);
        node = n;
    }
};
/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
const removeNodes = (container, startNode, endNode = null) => {
    let node = startNode;
    while (node !== endNode) {
        const n = node.nextSibling;
        container.removeChild(node);
        node = n;
    }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Interprets a template literal as a lit-extended HTML template.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', extendedPartCallback);
/**
 * Interprets a template literal as a lit-extended SVG template.
 */
const svg = (strings, ...values) => new SVGTemplateResult(strings, values, 'svg', extendedPartCallback);
/**
 * A PartCallback which allows templates to set properties and declarative
 * event handlers.
 *
 * Properties are set by default, instead of attributes. Attribute names in
 * lit-html templates preserve case, so properties are case sensitive. If an
 * expression takes up an entire attribute value, then the property is set to
 * that value. If an expression is interpolated with a string or other
 * expressions then the property is set to the string result of the
 * interpolation.
 *
 * To set an attribute instead of a property, append a `$` suffix to the
 * attribute name.
 *
 * Example:
 *
 *     html`<button class$="primary">Buy Now</button>`
 *
 * To set an event handler, prefix the attribute name with `on-`:
 *
 * Example:
 *
 *     html`<button on-click=${(e)=> this.onClickHandler(e)}>Buy Now</button>`
 *
 */
const extendedPartCallback = (instance, templatePart, node) => {
    if (templatePart.type === 'attribute') {
        if (templatePart.rawName.substr(0, 3) === 'on-') {
            const eventName = templatePart.rawName.slice(3);
            return new EventPart(instance, node, eventName);
        }
        const lastChar = templatePart.name.substr(templatePart.name.length - 1);
        if (lastChar === '$') {
            const name = templatePart.name.slice(0, -1);
            return new AttributePart(instance, node, name, templatePart.strings);
        }
        if (lastChar === '?') {
            const name = templatePart.name.slice(0, -1);
            return new BooleanAttributePart(instance, node, name, templatePart.strings);
        }
        return new PropertyPart(instance, node, templatePart.rawName, templatePart.strings);
    }
    return defaultPartCallback(instance, templatePart, node);
};
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart extends AttributePart {
    setValue(values, startIndex) {
        const s = this.strings;
        if (s.length === 2 && s[0] === '' && s[1] === '') {
            const value = getValue(this, values[startIndex]);
            if (value === noChange) {
                return;
            }
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
        }
        else {
            throw new Error('boolean attributes can only contain a single expression');
        }
    }
}
class PropertyPart extends AttributePart {
    setValue(values, startIndex) {
        const s = this.strings;
        let value;
        if (this._equalToPreviousValues(values, startIndex)) {
            return;
        }
        if (s.length === 2 && s[0] === '' && s[1] === '') {
            // An expression that occupies the whole attribute value will leave
            // leading and trailing empty strings.
            value = getValue(this, values[startIndex]);
        }
        else {
            // Interpolation, so interpolate
            value = this._interpolate(values, startIndex);
        }
        if (value !== noChange) {
            this.element[this.name] = value;
        }
        this._previousValues = values;
    }
}
class EventPart {
    constructor(instance, element, eventName) {
        this.instance = instance;
        this.element = element;
        this.eventName = eventName;
    }
    setValue(value) {
        const listener = getValue(this, value);
        if (listener === this._listener) {
            return;
        }
        if (listener == null) {
            this.element.removeEventListener(this.eventName, this);
        }
        else if (this._listener == null) {
            this.element.addEventListener(this.eventName, this);
        }
        this._listener = listener;
    }
    handleEvent(event) {
        if (typeof this._listener === 'function') {
            this._listener.call(this.element, event);
        }
        else if (typeof this._listener.handleEvent === 'function') {
            this._listener.handleEvent(event);
        }
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
    NodeFilter.SHOW_TEXT;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1, removed 4 nodes)
 */
function removeNodesFromTemplate(template, nodesToRemove) {
    const { element: { content }, parts } = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = 0;
    let part = parts[0];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
        nodeIndex++;
        const node = walker.currentNode;
        // End removal if stepped past the removing node
        if (node.previousSibling === currentRemovingNode) {
            currentRemovingNode = null;
        }
        // A node to remove was found in the template
        if (nodesToRemove.has(node)) {
            nodesToRemoveInTemplate.push(node);
            // Track node we're removing
            if (currentRemovingNode === null) {
                currentRemovingNode = node;
            }
        }
        // When removing, increment count by which to adjust subsequent part indices
        if (currentRemovingNode !== null) {
            removeCount++;
        }
        while (part !== undefined && part.index === nodeIndex) {
            // If part is in a removed node deactivate it by setting index to -1 or
            // adjust the index as needed.
            part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
            part = parts[++partIndex];
        }
    }
    nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
}
const countNodes = (node) => {
    let count = 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
        count++;
    }
    return count;
};
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts.length; i++) {
        const part = parts[i];
        if (isTemplatePartActive(part)) {
            return i;
        }
    }
    return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
function insertNodeIntoTemplate(template, node, refNode = null) {
    const { element: { content }, parts } = template;
    // If there's no refNode, then put node at end of template.
    // No part indices need to be shifted in this case.
    if (refNode === null || refNode === undefined) {
        content.appendChild(node);
        return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
        walkerIndex++;
        const walkerNode = walker.currentNode;
        if (walkerNode === refNode) {
            refNode.parentNode.insertBefore(node, refNode);
            insertCount = countNodes(node);
        }
        while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
            // If we've inserted the node, simply adjust all subsequent parts
            if (insertCount > 0) {
                while (partIndex !== -1) {
                    parts[partIndex].index += insertCount;
                    partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                }
                return;
            }
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === undefined) {
        templateCache = new Map();
        templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.get(result.strings);
    if (template === undefined) {
        const element = result.getTemplateElement();
        if (typeof window.ShadyCSS === 'object') {
            window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.set(result.strings, template);
    }
    return template;
};
const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */
function removeStylesFromLitTemplates(scopeName) {
    TEMPLATE_TYPES.forEach((type) => {
        const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
        if (templates !== undefined) {
            templates.forEach((template) => {
                const { element: { content } } = template;
                const styles = content.querySelectorAll('style');
                removeNodesFromTemplate(template, new Set(Array.from(styles)));
            });
        }
    });
}
const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered output.
 */
const ensureStylesScoped = (fragment, template, scopeName) => {
    // only scope element template once per scope name
    if (!shadyRenderSet.has(scopeName)) {
        shadyRenderSet.add(scopeName);
        const styleTemplate = document.createElement('template');
        Array.from(fragment.querySelectorAll('style')).forEach((s) => {
            styleTemplate.content.appendChild(s);
        });
        window.ShadyCSS.prepareTemplateStyles(styleTemplate, scopeName);
        // Fix templates: note the expectation here is that the given `fragment`
        // has been generated from the given `template` which contains
        // the set of templates rendered into this scope.
        // It is only from this set of initial templates from which styles
        // will be scoped and removed.
        removeStylesFromLitTemplates(scopeName);
        // ApplyShim case
        if (window.ShadyCSS.nativeShadow) {
            const style = styleTemplate.content.querySelector('style');
            if (style !== null) {
                // Insert style into rendered fragment
                fragment.insertBefore(style, fragment.firstChild);
                // Insert into lit-template (for subsequent renders)
                insertNodeIntoTemplate(template, style.cloneNode(true), template.element.content.firstChild);
            }
        }
    }
};
// NOTE: We're copying code from lit-html's `render` method here.
// We're doing this explicitly because the API for rendering templates is likely
// to change in the near term.
function render(result, container, scopeName) {
    const templateFactory = shadyTemplateFactory(scopeName);
    const template = templateFactory(result);
    let instance = container.__templateInstance;
    // Repeat render, just call update()
    if (instance !== undefined && instance.template === template &&
        instance._partCallback === result.partCallback) {
        instance.update(result.values);
        return;
    }
    // First render, create a new TemplateInstance and append it
    instance =
        new TemplateInstance(template, result.partCallback, templateFactory);
    container.__templateInstance = instance;
    const fragment = instance._clone();
    instance.update(result.values);
    const host = container instanceof ShadowRoot ?
        container.host :
        undefined;
    // If there's a shadow host, do ShadyCSS scoping...
    if (host !== undefined && typeof window.ShadyCSS === 'object') {
        ensureStylesScoped(fragment, template, scopeName);
        window.ShadyCSS.styleElement(host);
    }
    removeNodes(container, container.firstChild);
    container.appendChild(fragment);
}

const Reflection = Object.assign(Reflect, {
    decorate,
    defineMetadata,
    getMetadata,
    getOwnMetadata,
    hasOwnMetadata,
    metadata,
});
const Metadata = new WeakMap();
function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
    return ordinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
}
function decorate(decorators, target, propertyKey, attributes) {
    if (decorators.length === 0)
        throw new TypeError();
    if (typeof target === 'function') {
        return decorateConstructor(decorators, target);
    }
    else if (propertyKey !== undefined) {
        return decorateProperty(decorators, target, propertyKey, attributes);
    }
    return;
}
function metadata(metadataKey, metadataValue) {
    return function decorator(target, propertyKey) {
        ordinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
    };
}
function getMetadata(metadataKey, target, propertyKey) {
    return ordinaryGetMetadata(metadataKey, target, propertyKey);
}
function getOwnMetadata(metadataKey, target, propertyKey) {
    return ordinaryGetOwnMetadata(metadataKey, target, propertyKey);
}
function hasOwnMetadata(metadataKey, target, propertyKey) {
    return !!ordinaryGetOwnMetadata(metadataKey, target, propertyKey);
}
function decorateConstructor(decorators, target) {
    decorators.reverse().forEach((decorator) => {
        const decorated = decorator(target);
        if (decorated) {
            target = decorated;
        }
    });
    return target;
}
function decorateProperty(decorators, target, propertyKey, descriptor) {
    decorators.reverse().forEach((decorator) => {
        descriptor = decorator(target, propertyKey, descriptor) || descriptor;
    });
    return descriptor;
}
function ordinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey) {
    if (propertyKey && !['string', 'symbol'].includes(typeof propertyKey))
        throw new TypeError();
    (getMetadataMap(target, propertyKey) || createMetadataMap(target, propertyKey))
        .set(metadataKey, metadataValue);
}
function ordinaryGetMetadata(metadataKey, target, propertyKey) {
    return !!ordinaryGetOwnMetadata(metadataKey, target, propertyKey)
        ? ordinaryGetOwnMetadata(metadataKey, target, propertyKey)
        : Object.getPrototypeOf(target)
            ? ordinaryGetMetadata(metadataKey, Object.getPrototypeOf(target), propertyKey)
            : undefined;
}
function ordinaryGetOwnMetadata(metadataKey, target, propertyKey) {
    if (target === undefined)
        throw new TypeError();
    const metadataMap = getMetadataMap(target, propertyKey);
    return metadataMap && metadataMap.get(metadataKey);
}
function getMetadataMap(target, propertyKey) {
    return Metadata.get(target) && Metadata.get(target).get(propertyKey);
}
function createMetadataMap(target, propertyKey) {
    const targetMetadata = new Map();
    Metadata.set(target, targetMetadata);
    const metadataMap = new Map();
    targetMetadata.set(propertyKey, metadataMap);
    return metadataMap;
}

/** Convert `fooBar` to `foo-bar`. */
function attributeNameFromProperty(name) {
    return name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
/** Convert `foo` to `_foo`. */
function privatePropertyName(name) {
    return `__${name}`;
}

const primitiveTypes = [Boolean, Number, String];
function isPrimitive(type) {
    return primitiveTypes.includes(type);
}
function alreadyObserved(target, name, type) {
    return target.constructor[observeType(type)].includes(name);
}
function observeType(type) {
    return isPrimitive(type) ? 'observedAttributes' : 'observedProperties';
}
function observeName(prop, type) {
    return isPrimitive(type) ? attributeNameFromProperty(prop) : prop;
}
function observe(target, name, type) {
    if (!alreadyObserved(target, name, type)) {
        target.constructor[observeType(type)].push(observeName(name, type));
    }
}
function getter(name, type) {
    const attributeName = attributeNameFromProperty(name);
    return function () {
        switch (type) {
            case String:
                return this.getAttribute(attributeName);
            case Number:
                if (this.hasAttribute(attributeName)) {
                    return Number(this.getAttribute(attributeName));
                }
                else {
                    return null;
                }
            case Boolean:
                return this.hasAttribute(attributeName);
            default:
                return this[privatePropertyName(name)];
        }
    };
}
function setter(name, type) {
    const attributeName = attributeNameFromProperty(name);
    return function (value) {
        if (this._ignoreDefaultValue(name) && isPrimitive(type)) {
            this._ignoredDefaultAttributes[name] = true;
            return;
        }
        else if (!this._ignoredDefaultAttributes[name]) {
            this._ignoredDefaultAttributes[name] = true;
        }
        if (value === null || value === undefined || value === false || value === '') {
            this.removeAttribute(attributeName);
        }
        else {
            switch (type) {
                case String:
                    this.setAttribute(attributeName, String(value));
                    break;
                case Number:
                    this.setAttribute(attributeName, String(value));
                    break;
                case Boolean:
                    this.setAttribute(attributeName, '');
                    break;
                default:
                    this[privatePropertyName(name)] = value;
            }
        }
        this.render();
    };
}
function Property(options) {
    return function (target, name) {
        const type = (options && options.type) || Reflection.getMetadata('design:type', target, name);
        observe(target, name, type);
        Object.defineProperty(target, name, {
            configurable: true,
            enumerable: true,
            get: getter(name, type),
            set: setter(name, type),
        });
    };
}

class Seed extends HTMLElement {
    constructor() {
        super();
        this._connected = false;
        this._ignoredDefaultAttributes = {};
        this.attachShadow({ mode: 'open' });
    }
    /** The component instance has been inserted into the DOM. */
    connectedCallback() {
        this._connected = true;
        this.upgradeProperties();
        this.upgradePropertyAttributes();
        this.render();
    }
    /** The component instance has been removed from the DOM. */
    disconnectedCallback() {
        this._connected = false;
    }
    /** Rerender when the observed attributes change. */
    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.render();
    }
    /** Render the component. */
    render() {
        if (this._connected) {
            render(this._template, this.shadowRoot, this.tagName.toLowerCase());
        }
    }
    /** Helper to query the rendered shadowRoot with querySelector. `this.$('tag.class')` */
    $(selectors) {
        return this.shadowRoot.querySelector(selectors);
    }
    /** Helper to query the rendered shadowRoot with querySelectorAll. `this.$$('tag.class')` */
    $$(selectors) {
        return this.shadowRoot.querySelectorAll(selectors);
    }
    /** Combine the components styles and template. */
    get _template() {
        return html `
    <style>
      :host {
        display: block;
        overflow: hidden;
      }

      :host([hidden]) {
        display: none;
      }
    </style>
    ${this.styles}
    ${this.template}
    <!-- Built, tested, and published with Nutmeg. https://nutmeg.tools -->
    `;
    }
    /** Support lazy properties https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties */
    upgradeProperties() {
        const instance = this;
        const props = (instance).constructor['observedAttributes'].concat((instance).constructor['observedProperties']);
        props.forEach((prop) => {
            if (instance.hasOwnProperty(prop)) {
                let value = (instance)[prop];
                delete (instance)[prop];
                (instance)[prop] = value;
            }
        });
    }
    /** Perform a one-time upgrade of complex properties from JSON encoded attributes. */
    upgradePropertyAttributes() {
        const instance = this;
        (instance).constructor['observedProperties'].forEach((prop) => {
            const attribute = attributeNameFromProperty(prop);
            if (instance.hasAttribute(attribute)) {
                (instance)[prop] = JSON.parse(instance.getAttribute(attribute));
                instance.removeAttribute(attribute);
            }
        });
    }
    /** Assume TypeScript is setting a default value and it should be ignored because of a user set value. */
    _ignoreDefaultValue(name) {
        return !this._connected && !this._ignoredDefaultAttributes[name] && this.hasAttribute(attributeNameFromProperty(name));
    }
}
Seed.observedProperties = [];
Seed.observedAttributes = [];

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var approximateNumber = createCommonjsModule(function (module) {
/* Approximate Number - outputs numbers in human-readable format, similar to ls -lh or Stack Overflow's reputation
 *
 * https://github.com/nfriedly/approximate-number
 *
 * Copyright (c) 2014 Nathan Friedly
 * Licensed under the MIT license.
 */
(function() {

  function addCommas(num, opts) {
    if (opts.separator === false) {
      return num.toString();
    }

    if (num < 1000) {
      return num.toString();
    }

    var separator = (typeof opts.separator === 'string' ? opts.separator : ',');

    var out = [],
      digits = Math.round(num).toString().split('');

    digits.reverse().forEach(function(digit, i){
      if (i && i%3 === 0) {
        out.push(separator);
      }
      out.push(digit);
    });

    return out.reverse().join('');
  }

  function formatDec(num, base, opts) {
    var workingNum = num/base;
    var ROUND = opts.round ? 'round' : 'floor';
    if (opts.decimal === false) {
      num = Math[ROUND](workingNum);
      return num.toString();
    }
    num = workingNum < 10 ? (Math[ROUND](workingNum * 10) / 10) : Math[ROUND](workingNum);
    num = num.toString();
    if (typeof opts.decimal === 'string') {
      num = num.replace('.', opts.decimal);
    }
    return num;
  }

  var THOUSAND = 1000;
  var TEN_THOUSAND = 10000;
  var MILLION = 1000000;
  var BILLION = 1000000000;
  var TRILLION = 1000000000000;

  /**
   * Converts big numbers into human-readable forms
   * @param {Number} num
   * @param {Object} [opts]
   * @param {String|Boolean} [opts.separator=',']  Thousands separator - set to a string (e.g. '.') to use that string or false to not use any separator
   * @param {String|Boolean} [opts.decimal='.'] Decimal - set to a string (e.g. ',') to use that or set to false to avoid outputting values with a decimal
   * @param {Boolean} [opts.round=false] Round numbers off rather than flooring/truncating. When true, 105000 would become '11m', when false it becomes '10m'
   * @param {Boolean} [opts.min10k=false] Do not abbreviate numbers below 10000. E.g. 9999 would become '9,999' rather than '9k'. (Stack Overflow-style)
   * @param {String} [opts.prefix=''] Optional string to prepend to the value, e.g. '$'
   * @param {String} [opts.suffix=''] Optional string to append to the value, e.g. '%'
   *
   * @returns {String}
   */
  function approximateNumber(num, opts) {
    var numString;
    opts = opts || {};

    // if we're working on a negative number, convert it to positive and then prefix the final result with a -
    var negative = num < 0;
    if (negative) {
      num = Math.abs(num);
    }

    var thousandsBreak = opts.min10k ? TEN_THOUSAND : THOUSAND;

    if (num < thousandsBreak) {
      numString = addCommas(formatDec(num, 1, opts), opts);
    } else if (num < MILLION) {
      numString =  formatDec(num, THOUSAND, opts) + 'k';
    } else if (num < BILLION) {
      numString =  formatDec(num, MILLION, opts) + 'm';
    } else if (num < TRILLION) {
      numString =  addCommas(formatDec(num,  BILLION, opts), opts) + 'b';
    } else {
      numString = addCommas(formatDec(num,  TRILLION, opts), opts) + 't';
    }

    if (negative) {
      numString = '-' + numString;
    }

    if (opts.capital) {
      numString = numString.toUpperCase();
    }

    if (opts.prefix) {
      numString = opts.prefix + numString;
    }
    if (opts.suffix) {
      numString = numString + opts.suffix;
    }

    return numString;
  }

  approximateNumber.addCommas = addCommas;

  {
    // node.js/common js
    module.exports = approximateNumber;
  }
}());
});

class Cache {
    constructor(githubRepository) {
        this.CACHE_LENGTH = 24 * 60 * 60 * 1000;
        this.githubRepository = githubRepository;
    }
    get data() {
        return this.cache.data;
    }
    set data(data) {
        if (!data) {
            return;
        }
        const cache = {
            data: data,
            cachedAt: Date.now(),
        };
        localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    }
    get expired() {
        return this.cachedAt < Date.now() - this.CACHE_LENGTH;
    }
    get cachedAt() {
        return this.cache.cachedAt || Date.now();
    }
    get cache() {
        const cache = localStorage.getItem(this.cacheKey);
        if (cache) {
            return JSON.parse(cache);
        }
        else {
            return {
                cachedAt: 0,
                data: null,
            };
        }
    }
    get cacheKey() {
        return `github-repository_${this.githubRepository.ownerRepo}_cache`;
    }
}

class Colors {
    static language(language) {
        return this.colors[language] || '#ccc';
    }
}
Colors.colors = {
    '1C Enterprise': '#814CCC',
    'ABAP': '#E8274B',
    'ActionScript': '#882B0F',
    'Ada': '#02f88c',
    'Agda': '#315665',
    'AGS Script': '#B9D9FF',
    'Alloy': '#64C800',
    'AMPL': '#E6EFBB',
    'ANTLR': '#9DC3FF',
    'API Blueprint': '#2ACCA8',
    'APL': '#5A8164',
    'AppleScript': '#101F1F',
    'Arc': '#aa2afe',
    'Arduino': '#bd79d1',
    'ASP': '#6a40fd',
    'AspectJ': '#a957b0',
    'Assembly': '#6E4C13',
    'ATS': '#1ac620',
    'AutoHotkey': '#6594b9',
    'AutoIt': '#1C3552',
    'Ballerina': '#FF5000',
    'Batchfile': '#C1F12E',
    'BlitzMax': '#cd6400',
    'Boo': '#d4bec1',
    'Brainfuck': '#2F2530',
    'C': '#555555',
    'C#': '#178600',
    'C++': '#f34b7d',
    'Ceylon': '#dfa535',
    'Chapel': '#8dc63f',
    'Cirru': '#ccccff',
    'Clarion': '#db901e',
    'Clean': '#3F85AF',
    'Click': '#E4E6F3',
    'Clojure': '#db5855',
    'CoffeeScript': '#244776',
    'ColdFusion': '#ed2cd6',
    'Common Lisp': '#3fb68b',
    'Component Pascal': '#B0CE4E',
    'Crystal': '#776791',
    'CSS': '#563d7c',
    'Cuda': '#3A4E3A',
    'D': '#ba595e',
    'Dart': '#00B4AB',
    'DataWeave': '#003a52',
    'DM': '#447265',
    'Dogescript': '#cca760',
    'Dylan': '#6c616e',
    'E': '#ccce35',
    'eC': '#913960',
    'ECL': '#8a1267',
    'Eiffel': '#946d57',
    'Elixir': '#6e4a7e',
    'Elm': '#60B5CC',
    'Emacs Lisp': '#c065db',
    'EmberScript': '#FFF4F3',
    'EQ': '#a78649',
    'Erlang': '#B83998',
    'F#': '#b845fc',
    'Factor': '#636746',
    'Fancy': '#7b9db4',
    'Fantom': '#14253c',
    'FLUX': '#88ccff',
    'Forth': '#341708',
    'Fortran': '#4d41b1',
    'FreeMarker': '#0050b2',
    'Frege': '#00cafe',
    'Game Maker Language': '#8fb200',
    'Genie': '#fb855d',
    'Gherkin': '#5B2063',
    'Glyph': '#e4cc98',
    'Gnuplot': '#f0a9f0',
    'Go': '#375eab',
    'Golo': '#88562A',
    'Gosu': '#82937f',
    'Grammatical Framework': '#79aa7a',
    'Groovy': '#e69f56',
    'Hack': '#878787',
    'Harbour': '#0e60e3',
    'Haskell': '#5e5086',
    'Haxe': '#df7900',
    'HTML': '#e34c26',
    'Hy': '#7790B2',
    'IDL': '#a3522f',
    'Io': '#a9188d',
    'Ioke': '#078193',
    'Isabelle': '#FEFE00',
    'J': '#9EEDFF',
    'Java': '#b07219',
    'JavaScript': '#f1e05a',
    'Jolie': '#843179',
    'JSONiq': '#40d47e',
    'Julia': '#a270ba',
    'Jupyter Notebook': '#DA5B0B',
    'Kotlin': '#F18E33',
    'KRL': '#28431f',
    'Lasso': '#999999',
    'Lex': '#DBCA00',
    'LiveScript': '#499886',
    'LLVM': '#185619',
    'LOLCODE': '#cc9900',
    'LookML': '#652B81',
    'LSL': '#3d9970',
    'Lua': '#000080',
    'Makefile': '#427819',
    'Mask': '#f97732',
    'Matlab': '#e16737',
    'Max': '#c4a79c',
    'MAXScript': '#00a6a6',
    'Mercury': '#ff2b2b',
    'Meson': '#007800',
    'Metal': '#8f14e9',
    'Mirah': '#c7a938',
    'MQL4': '#62A8D6',
    'MQL5': '#4A76B8',
    'MTML': '#b7e1f4',
    'NCL': '#28431f',
    'Nearley': '#990000',
    'Nemerle': '#3d3c6e',
    'nesC': '#94B0C7',
    'NetLinx': '#0aa0ff',
    'NetLinx+ERB': '#747faa',
    'NetLogo': '#ff6375',
    'NewLisp': '#87AED7',
    'Nim': '#37775b',
    'Nit': '#009917',
    'Nix': '#7e7eff',
    'Nu': '#c9df40',
    'Objective-C': '#438eff',
    'Objective-C++': '#6866fb',
    'Objective-J': '#ff0c5a',
    'OCaml': '#3be133',
    'Omgrofl': '#cabbff',
    'ooc': '#b0b77e',
    'Opal': '#f7ede0',
    'Oxygene': '#cdd0e3',
    'Oz': '#fab738',
    'P4': '#7055b5',
    'Pan': '#cc0000',
    'Papyrus': '#6600cc',
    'Parrot': '#f3ca0a',
    'Pascal': '#E3F171',
    'PAWN': '#dbb284',
    'Pep8': '#C76F5B',
    'Perl': '#0298c3',
    'Perl 6': '#0000fb',
    'PHP': '#4F5D95',
    'PigLatin': '#fcd7de',
    'Pike': '#005390',
    'PLSQL': '#dad8d8',
    'PogoScript': '#d80074',
    'PostScript': '#da291c',
    'PowerBuilder': '#8f0f8d',
    'PowerShell': '#012456',
    'Processing': '#0096D8',
    'Prolog': '#74283c',
    'Propeller Spin': '#7fa2a7',
    'Puppet': '#302B6D',
    'PureBasic': '#5a6986',
    'PureScript': '#1D222D',
    'Python': '#3572A5',
    'QML': '#44a51c',
    'R': '#198CE7',
    'Racket': '#22228f',
    'Ragel': '#9d5200',
    'RAML': '#77d9fb',
    'Rascal': '#fffaa0',
    'Rebol': '#358a5b',
    'Red': '#f50000',
    "Ren'Py": '#ff7f7f',
    'Ring': '#0e60e3',
    'Roff': '#ecdebe',
    'Rouge': '#cc0088',
    'Ruby': '#701516',
    'RUNOFF': '#665a4e',
    'Rust': '#dea584',
    'SaltStack': '#646464',
    'SAS': '#B34936',
    'Scala': '#c22d40',
    'Scheme': '#1e4aec',
    'Self': '#0579aa',
    'Shell': '#89e051',
    'Shen': '#120F14',
    'Slash': '#007eff',
    'Smalltalk': '#596706',
    'SourcePawn': '#5c7611',
    'SQF': '#3F3F3F',
    'Squirrel': '#800000',
    'SRecode Template': '#348a34',
    'Stan': '#b2011d',
    'Standard ML': '#dc566d',
    'SuperCollider': '#46390b',
    'Swift': '#ffac45',
    'SystemVerilog': '#DAE1C2',
    'Tcl': '#e4cc98',
    'Terra': '#00004c',
    'TeX': '#3D6117',
    'TI Program': '#A0AA87',
    'Turing': '#cf142b',
    'TypeScript': '#2b7489',
    'UnrealScript': '#a54c4d',
    'Vala': '#fbe5cd',
    'Verilog': '#b2b7f8',
    'VHDL': '#adb2cb',
    'Vim script': '#199f4b',
    'Visual Basic': '#945db7',
    'Volt': '#1F1F1F',
    'Vue': '#2c3e50',
    'WebAssembly': '#04133b',
    'wisp': '#7582D1',
    'X10': '#4B6BEF',
    'xBase': '#403a40',
    'XC': '#99DA07',
    'XQuery': '#5232e7',
    'XSLT': '#EB8CEB',
    'Yacc': '#4B6C4B',
    'Zephir': '#118f9e'
};

class User {
    constructor(user) {
        this.data = user;
    }
    get htmlUrl() {
        return this.data.html_url;
    }
    get login() {
        return this.data.login;
    }
}

class License {
    constructor(license) {
        this.data = license;
    }
    get name() {
        return this.data ? this.data.name : 'Unknown license';
    }
}

class Repo {
    constructor(data) {
        this.data = data;
        this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.license = new License(data.license);
        this.owner = new User(data.owner);
    }
    get name() {
        return this.data.name;
    }
    get fullName() {
        return this.data.full_name;
    }
    get htmlUrl() {
        return this.data.html_url;
    }
    get description() {
        return this.data.description;
    }
    get sshUrl() {
        return this.data.ssh_url;
    }
    get displayPushedAt() {
        const month = this.months[this.pushedAt.getMonth()];
        return `${month} ${this.pushedAt.getDate()} ${this.pushedYear}`;
    }
    get homepage() {
        return this.data.homepage;
    }
    get displayHomepage() {
        return (this.homepage || '')
            .replace('http://www.', '')
            .replace('https://www.', '')
            .replace('http://', '')
            .replace('https://', '');
    }
    get starsCount() {
        return this.data.stargazers_count;
    }
    get watchersCount() {
        return this.data.subscribers_count;
    }
    get openIssuesCount() {
        return this.data.open_issues_count;
    }
    get forksCount() {
        return this.data.forks_count;
    }
    get language() {
        return this.data.language || 'Unknown language';
    }
    get languageColor() {
        return Colors.language(this.data.language);
    }
    get displayLicense() {
        return this.license.name;
    }
    get pushedAt() {
        return new Date(Date.parse(this.data.pushed_at));
    }
    get pushedYear() {
        return (new Date()).getFullYear() === this.pushedAt.getFullYear() ? '' : `${this.pushedAt.getFullYear()}`;
    }
}
class EmptyRepo {
    constructor() {
        this.id = 0;
        this.fullName = '';
        this.owner = { htmlUrl: '', login: '' };
        this.htmlUrl = '';
        this.name = '';
        this.description = '';
        this.homepage = '';
        this.displayHomepage = '';
        this.sshUrl = '';
        this.watchersCount = 0;
        this.starsCount = 0;
        this.openIssuesCount = 0;
        this.forksCount = 0;
        this.language = '';
        this.languageColor = '';
        this.displayPushedAt = '';
        this.displayLicense = '';
    }
}

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class GithubRepository extends Seed {
    constructor() {
        super();
        this.ownerRepo = '';
        this._repo = new EmptyRepo();
        this.pending = false;
        this.cache = new Cache(this);
    }
    /** The component instance has been inserted into the DOM. */
    connectedCallback() {
        super.connectedCallback();
    }
    /** The component instance has been removed from the DOM. */
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    /** Watch for changes to these attributes. */
    static get observedAttributes() {
        return super.observedAttributes;
    }
    /** Rerender when the observed attributes change. */
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
    }
    get repo() {
        if (this.cache.data && !!this.ownerRepo && this.ownerRepo !== this._repo.fullName) {
            this._repo = new Repo(this.cache.data);
        }
        if (!this._repo || this.cache.expired || this.ownerRepo !== this._repo.fullName) {
            this.fetchRepository();
        }
        return this._repo;
    }
    async fetchRepository() {
        if (this.pending || !this.ownerRepo) {
            return;
        }
        this.pending = true;
        const response = await fetch(`https://api.github.com/repos/${this.ownerRepo}`);
        const data = await response.json();
        if (response.status === 200) {
            this._repo = new Repo(data);
            this.cache.data = data;
        }
        else {
            this.error = data.message;
        }
        this.pending = false;
        this.render();
    }
    countDisplay(count) {
        return approximateNumber(count);
    }
    /** Styling for the component. */
    get styles() {
        return html `
      <style>
        :host {
          border: 1px solid #E0E0E0;
          border-radius: 8px;
        }

        .content {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          padding-bottom: 16px;
          background-color: #FFFFFF;
          color: #000000;
          display: flex;
          flex-direction: column;
        }

        .row {
          margin: 12px 16px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        #header {
          padding-top: 16px;
          margin-top: 0;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 28px;
        }

        #footer {
          margin-bottom: 0;
        }

        #clone {
          padding: 0 16px;
          margin: 0;
          background-color: #E0E0E0;
          overflow: hidden;
        }

        #counters {
          overflow: hidden;
        }

        #counters svg {
          height: 12px;
        }

        #counters .item {
          display: flex;
          flex-direction: column;
          text-align: center;
        }

        #counters .number {
          font-size: 20px;
        }

        #badges-slot {
          margin: 0 16px;
          justify-content: start;
          overflow: hidden;
        }

        #images-slot::slotted(img) {
          width: 100%;
        }

        ::slotted(a) {
          margin: 12px 2px;
        }

        /* Workaround for ShadyDOM polyfill */
        [slot="images"] {
          width: 100%;
        }

        /* Workaround for ShadyDOM polyfill */
        #badges-slot a {
          margin: 12px 2px;
        }

        #footer .item {
          min-width: 100px;
        }

        .logo svg {
          width: 38px;
          height: 38px;
        }

        .language-color {
          position: relative;
          top: 1px;
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        a {
          color: #0366d6;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        #homepage {
          margin-left: 8px;
        }

        /* loading */

        #loader {
          margin 24px;
        }

        .loader-item {
          padding-top: 8px;
          margin-left: 16px;
          max-width: 472px;
          min-height: 220px;
        }

        @keyframes placeHolderShimmer{
          0%{
            background-position: -468px 0
          }
          100%{
            background-position: 468px 0
          }
        }

        .animated-background {
          animation-duration: 1s;
          animation-fill-mode: forwards;
          animation-iteration-count: infinite;
          animation-name: placeHolderShimmer;
          animation-timing-function: linear;
          background: #f6f7f8;
          background: linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%);
          background-size: 800px 104px;
          height: 96px;
          position: relative;
        }

        .background-masker {
          background: #FFFFFF;
          position: absolute;
        }

        .background-masker.header-top {
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
        }

        .background-masker.header-right {
          top: 10px;
          left: 40px;
          height: 8px;
          width: 10px;
        }

        .background-masker.header-right {
          width: auto;
          left: 300px;
          right: 0;
          height: 40px;
        }

        .background-masker.content-top,
        .background-masker.content-second-line,
        .background-masker.content-third-line,
        .background-masker.content-second-end,
        .background-masker.content-third-end,
        .background-masker.content-first-end {
          top: 40px;
          left: 0;
          right: 0;
          height: 6px;
        }

        .background-masker.content-top {
          height:20px;
        }

        .background-masker.content-first-end,
        .background-masker.content-second-end,
        .background-masker.content-third-end{
          width: auto;
          left: 380px;
          right: 0;
          top: 60px;
          height: 8px;
        }

        .background-masker.content-second-line  {
          top: 68px;
        }

        .background-masker.content-second-end {
          left: 420px;
          top: 74px;
        }

        .background-masker.content-third-line {
          top: 82px;
        }

        .background-masker.content-third-end {
          left: 300px;
          top: 88px;
        }
      </style>
    `;
    }
    get logo() {
        return svg `
      <svg xmlns="http://www.w3.org/2000/svg" aria-label="GitHub" role="img" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="50%"/>
        <path fill="#fff" d="M335 499c14 0 12 17 12 17H165s-2-17 12-17c13 0 16-6 16-12l-1-50c-71 16-86-28-86-28-12-30-28-37-28-37-24-16 1-16 1-16 26 2 40 26 40 26 22 39 59 28 74 22 2-17 9-28 16-35-57-6-116-28-116-126 0-28 10-51 26-69-3-6-11-32 3-67 0 0 21-7 70 26 42-12 86-12 128 0 49-33 70-26 70-26 14 35 6 61 3 67 16 18 26 41 26 69 0 98-60 120-117 126 10 8 18 24 18 48l-1 70c0 6 3 12 16 12z"/>
      </svg>
    `;
    }
    get issuesIcon() {
        return svg `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16">
        <path fill-rule="evenodd" d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"/>
      </svg>
    `;
    }
    get forkIcon() {
        return svg `
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16">
        <path fill-rule="evenodd" d="M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"/>
      </svg>
    `;
    }
    get starIcon() {
        return html `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16">
        <path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"/>
      </svg>
    `;
    }
    get watchIcon() {
        return html `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"/>
      </svg>
    `;
    }
    get headerTemplate() {
        return html `
      <div id="header" class="row">
        <span class="item">
          <a href="${this.repo.owner.htmlUrl}" target="_blank" rel="noopener">${this.repo.owner.login}</a> /
          <a href="${this.repo.htmlUrl}" target="_blank" rel="noopener">${this.repo.name}</a>
        </span>
        <span class="logo item"><a href="${this.repo.htmlUrl}" target="_blank" rel="noopener">${this.logo}</a></span>
      </div>
    `;
    }
    get descriptionTemplate() {
        return html `
      <div id="description" class="row">
        <span>
          ${this.repo.description}
          ${this.repo.homepage ? this.homepageTempate : ''}
        </span>
      </div>
    `;
    }
    get homepageTempate() {
        return html `
      <span id="homepage">
        <a href="${this.repo.homepage}" target="_blank" rel="noopener">${this.repo.displayHomepage}</a>
      </span>
    `;
    }
    get cloneTemplate() {
        return html `
      <div id="clone" class="row">
        <pre>${this.repo.sshUrl}</pre>
      </div>
    `;
    }
    get countsTemplate() {
        return html `
      <div id="counters" class="row">
        <a class="item" href="${this.repo.htmlUrl}/watchers" target="_blank" rel="noopener">
          <span>${this.watchIcon} Watchers</span>
          <span class="number">${this.countDisplay(this.repo.watchersCount)}</span>
        </a>
        <a class="item" href="${this.repo.htmlUrl}/stargazers" target="_blank" rel="noopener">
          <span>${this.starIcon} Stars</span>
          <span class="number">${this.countDisplay(this.repo.starsCount)}</span>
        </a>
        <a class="item" href="${this.repo.htmlUrl}/network" target="_blank" rel="noopener">
          <span>${this.forkIcon} Forks</span>
          <span class="number">${this.countDisplay(this.repo.forksCount)}</span>
        </a>
        <a class="item" href="${this.repo.htmlUrl}/issues" target="_blank" rel="noopener">
          <span>${this.issuesIcon} Issues</span>
          <span class="number">${this.countDisplay(this.repo.openIssuesCount)}</span>
        </a>
      </div>
    `;
    }
    get languageTemplate() {
        return html `
      <div id="language">
        <span class="language-color" style="background-color: ${this.repo.languageColor};"></span>
        ${this.repo.language}
      </div>
    `;
    }
    get footerTemplate() {
        return html `
      <div id="footer" class="row">
        <span class="item">${this.languageTemplate}</span>
        <span class="item">Updated ${this.repo.displayPushedAt}</span>
        <span class="item">${this.repo.displayLicense}</span>
      </div>
    `;
    }
    get errorTemplate() {
        return html `
      <div id="error" class="content">
        <div class="row"><span>Error getting <a href="https://github.com/${this.ownerRepo}" target="_blank" rel="noopener">${this.ownerRepo}</a> details from from GitHub:<span></div>
        <div class="row">"${this.error}"</div>
      </div>
    `;
    }
    get loadingTemplate() {
        return html `
      <div id="loader" class="content">
        <div class="loader-item">
          <div class="animated-background">
            <div class="background-masker header-top"></div>
            <div class="background-masker header-right"></div>
            <div class="background-masker content-top"></div>
            <div class="background-masker content-first-end"></div>
            <div class="background-masker content-second-line"></div>
            <div class="background-masker content-second-end"></div>
            <div class="background-masker content-third-line"></div>
            <div class="background-masker content-third-end"></div>
          </div>
        </div>
      </div>
    `;
    }
    get contentTemplate() {
        return html `
      <div class="content">
        <slot id="images-slot" name="images"></slot>
        ${this.headerTemplate}
        ${this.descriptionTemplate}
        ${this.countsTemplate}
        ${this.cloneTemplate}
        <div id="badges-slot" class="row">
          <slot class="row" name="badges"></slot>
        </div>
        ${this.footerTemplate}
      </div>
    `;
    }
    /** HTML Template for the component. */
    get template() {
        if (this.error) {
            return this.errorTemplate;
        }
        else if (!!this.repo.fullName) {
            return this.contentTemplate;
        }
        else {
            return this.loadingTemplate;
        }
    }
}
__decorate([
    Property(),
    __metadata("design:type", String)
], GithubRepository.prototype, "ownerRepo", void 0);
window.customElements.define('github-repository', GithubRepository);

export { GithubRepository };
//# sourceMappingURL=github-repository.js.map
