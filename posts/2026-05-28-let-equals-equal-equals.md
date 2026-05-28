---
title: Let Equals Equal Equals
published: true
audience: Web component authors, accessibility engineers, standards participants
tldr: |
  Setting `ariaDescribedByElements` on a node silently fails when the
  target is in a different shadow root. The spec broke `=` to preserve
  encapsulation purity. This violates the Priority of Constituencies,
  harms AT users, and should be fixed immediately. Reference Target is
  complementary and welcome, but it is not a substitute for making
  imperative assignment work.
coverImage: /assets/images/eq-eq-eq.png
coverImageAlt: An equals sign broken in half, with a shadow cast behind it
tags:
  - accessibility
  - web components
  - shadow dom
  - standards
---

## The Bug

Here's a line of JavaScript that looks like it does something:

```js
input.ariaDescribedByElements = [helpText];
```

You'd expect this to work. You're holding both nodes. You wrote the
assignment. The browser accepted it without complaint.

But if `helpText` lives in a shadow root that isn't an ancestor of
`input`'s shadow root, the assignment is silently discarded. The getter
returns `null`. No warning. No error. Assistive technology users get
nothing.

Browser spec authors intentionally broke `=`.

## Wait, What?

The [spec for reflected element references][mdn-scope] defines a "scope"
rule: the target element must be in the same DOM as the source, or in a
parent DOM. Siblings, cousins, children -- all silently rejected.

So this works:

```html
<div id="host">
  <template shadowrootmode="open">
    <input id="input">
    <span id="help">Help text</span>
  </template>
</div>
```

```js
// Same shadow root: works
input.ariaDescribedByElements = [help];
```

And this works:

```html
<span id="outer-help">Help text</span>
<div id="host">
  <template shadowrootmode="open">
    <input id="input">
  </template>
</div>
```

```js
// Referencing "up" into lighter DOM: works
input.ariaDescribedByElements = [outerHelp];
```

But this doesn't:

```html
<x-input>
  <template shadowrootmode="open">
    <input id="input">
  </template>
</x-input>
<x-tooltip>
  <template shadowrootmode="open">
    <span id="tip">Helpful description</span>
  </template>
</x-tooltip>
```

```js
// Sibling shadow roots: silently fails
input.ariaDescribedByElements = [tip];
// getter returns [], AT sees nothing
```

Same API. Same syntax. Same intent. Different result, depending on tree
position -- with no indication that anything went wrong.

I built a [codepen demonstrating the inconsistency][codepen]. The results
are, as [Steve Orvell][sorvell-gh] put it, "confusing and seemingly
inconsistent."

## Why Does This Happen?

The restriction was added to [prevent leaking shadow DOM
internals][whatwg-5401]. The concern: if you set
`el.ariaActiveDescendantElement` to something inside a shadow root, then
anyone with access to `el` could read that property and walk into the
shadow tree.

Here's the scenario that worried spec engineers, paraphrased from
[Alice Boxhall's analysis][alice-gist]:

```js
// Component sets aria reference to internal element
lightEl.ariaActiveDescendantElement = shadowChild;

// Now any script can traverse into the shadow tree
lightEl.ariaActiveDescendantElement
       .parentElement
       .appendChild(document.createTextNode("surprise"));
```

This is a real concern. But the solution they chose -- silently
discarding the setter -- trades an encapsulation worry for an
accessibility failure. And the encapsulation worry has a straightforward
fix (null out the getter while preserving the internal relationship for
AT), while the accessibility failure has no fix at all from the
developer's perspective, short of restructuring their entire DOM.

Moreover, the encapsulation concern is minor (most developers wouldn't care)
while the accessibility failure is _critical_.

## The Getter Problem Has Known Solutions

The spec discussion on [whatwg/html#5401][whatwg-5401] explored multiple
options for handling the getter when a referenced element is in a deeper
shadow root:

1. **Return null from the getter**, but keep the internal reference for
   AT -- the "attr-associated element" remains intact for the
   accessibility tree, even though JavaScript can't read it back.
2. **Retarget** the reference to the shadow host, similar to how events
   retarget when crossing shadow boundaries.
3. **Reference Target** -- the component explicitly declares which
   internal element should be exposed.

Options 1 and 2 solve the encapsulation leak without breaking the setter.
The spec authors chose something closer to option 0: discard everything
silently.

[Alice][alice-gh], who did much of the design work on ARIA element
reflection, [shared her frustration][alice-frustration] in a recent
discussion:

> I agree with Nolan's suggestion in the bug that developers should get
> a warning
>
> supporting the cross-root case was indeed what we hoped the feature
> would enable; there was push-back from other standards engineers based
> on the reasoning I explained in the bug, so yeah it is now in something
> of a semi-broken state, which is very frustrating when so much work
> went into it
>
> perhaps we would have been better off not trying to ship it at all

## Imperative Means Intentional

When a developer writes:

```js
input.ariaDescribedByElements = [someNode];
```

they already have both references. They already traversed whatever
boundaries stood between them and those nodes. The assignment is an
explicit, deliberate act.

As [Steve Orvell][sorvell-gh] (Lit team) noted after discussing with
Chrome engineers:

> this was done to hide shadow details, but I think there is room for
> push back since it's an imperative API and you need to be able to get
> access to all the nodes in question to use the API.

The encapsulation was already broken the moment you obtained the
reference. Having `=` silently un-break it doesn't restore
encapsulation. It just breaks accessibility.

Consider: why would anyone use the imperative API except to make a
cross-root reference? If the elements were in the same scope, you'd use
the `aria-describedby` content attribute with an ID. The *entire purpose*
of the imperative API is to connect elements that attributes can't reach.

This is also how developers have handled cross root references in userland
libraries for years, e.g. highcharts or leafmap mount points.

## The Priority of Constituencies

The W3C's [HTML Design Principles][hdp] establish a binding hierarchy:

> In case of conflict, consider users over authors over implementors
> over specifiers over theoretical purity.

The [Web Platform Design Principles][wpdp] reaffirm:

> User needs come before the needs of web page authors, which come
> before the needs of user agent implementors, which come before the
> needs of specification writers, which come before theoretical purity.

The current behavior inverts this. Spec engineers chose to protect
encapsulation purity over user access to accessibility features. The
constituency harmed (AT users) ranks highest in the hierarchy. The
constituency served (spec authors concerned about theoretical
encapsulation leaks) ranks lowest.

This isn't a close call. This is the worst possible violation of the highest
principles of the HTML spec itself, perpetrated by spec authors, in the name of
a theoretical purity that nobody asked for.

## "But What About Closed Shadow Roots?"

The encapsulation argument leans heavily on closed shadow roots. But
closed shadow roots are vanishingly rare in practice:

- **Chrome UseCounters** show open shadow DOM on ~17.5% of page loads vs
  closed on ~5.3%, but the closed figure is inflated by browser-internal
  UA shadow trees (`<video>`, `<input>`, etc.) and browser extensions.
- **No major web component framework** defaults to closed shadow roots.
  Lit, Stencil, FAST, Angular, Svelte, Vue -- all default to open.
  Several don't even support closed mode.
- Of **30,000+ Lit components on GitHub**, roughly 5-10 use closed
  shadow roots.
- [eslint-plugin-wc][eslint-wc] ships a `no-closed-shadow-root` rule,
  warning that "closed shadow roots are very rarely used and can hinder
  development/interaction with an element."
- Closed shadow roots provide [no real security boundary][arxenix].
  Browser vendors themselves ship extension APIs
  (`dom.openOrClosedShadowRoot`) to bypass them.

The spec is constraining a heavily-used imperative accessibility API to
protect encapsulation guarantees that almost nobody uses, that provide no
real security, and that actively harm the constituency the web platform
is supposed to serve first: users.

For a deeper dive into the data, see my [research on closed shadow root
usage][research].

## What Developers Actually Need

Here's a real pattern from the [ARIA 1.1 Combobox][combobox-pattern]
example, implemented with web components:

```html
<fancy-input>
  #shadow-root
    <input type="text">
</fancy-input>
<fancy-listbox>
  #shadow-root
    <ul role="listbox">
      <fancy-option>
        #shadow-root
          <li role="option">List item</li>
      </fancy-option>
    </ul>
</fancy-listbox>
```

The `<input>` needs `aria-activedescendant` pointing to the active
`<li>`. These shadow roots are siblings. The imperative API was supposed
to solve this. It doesn't.

As [Nolan Lawson][nolan-gh] (Salesforce) documented in
[WICG/aom#192][aom-192]:

> I guess for me the question is: "Why is it acceptable for elements in
> separate shadow roots to be linked with aria relationships, but *only*
> if those shadow roots are in a descendant-ancestor relationship (and
> only in one direction)?" To me, it's not clear what benefit this
> particular restriction provides.

This was filed in 2022. It remains open.

## Reference Target Is Great. Also Not Enough.

[Reference Target][ref-target] ([WICG/webcomponents#1086][rt-tracking])
is a promising proposal that lets a custom element declare which internal
element should be targeted by ARIA references. It's good work and I want
it to ship.

But Reference Target is complementary, not a substitute:

- Reference Target requires the *component author* to opt in. If a
  third-party component doesn't implement it, you're stuck.
- Reference Target addresses the declarative case (`aria-describedby`
  attributes). The imperative case (`ariaDescribedByElements = [...]`)
  should work independently.
- Reference Target is still in development. Phase 1 has [open
  blockers][rt-tracking]. The imperative API exists today and is broken
  today.
- `=` should mean `=`. Reference target doesn't fix that.

We should have both: Reference Target for the clean declarative path,
and working imperative assignment for everything else.

## The Fix

1. **Make the setter work.** When a developer assigns
   `el.ariaDescribedByElements = [node]`, persist the internal
   relationship for the accessibility tree regardless of shadow root
   topology.

2. **Null out the getter if needed.** If the referenced element is in a
   deeper/sibling shadow root, return `null` from the JavaScript getter.
   This preserves encapsulation for scripts while letting AT see the
   relationship. This approach was [explored in the spec discussion]
   [whatwg-5401] and is implementable.

3. **Warn, don't fail.** At minimum, emit a console warning when an
   assignment is silently scoped away. Nolan Lawson [suggested
   this][nolan-warning] and it's the bare minimum: developers need to know
   when their accessibility code doesn't do what they wrote.

4. **Ship Reference Target too.** It's the right long-term solution for
   the declarative case. These are not competing proposals.

## The Cost of Silence

Here's the real damage. A developer writes:

```js
for (const node of descriptors) {
  el.ariaLabelledByElements = [
    ...el.ariaLabelledByElements,
    node,
  ];
}
```

This loop looks obvious. It's not. Some iterations silently succeed,
others silently fail, depending on the shadow root positions of elements
that the developer may not even control. Only extensive manual testing
with a screen reader will reveal the failure. Many developers won't do
that testing. AT users will pay the price.

When a platform API silently discards accessibility relationships, it
isn't protecting users from encapsulation violations. It's protecting
spec purity from users.

That's backwards. Fix it.

[mdn-scope]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Reflected_attributes#reflected_element_reference_scope
[codepen]: https://codepen.io/editor/bennyp/pen/019e64a4-62ca-71cd-9984-445df5c53747
[sorvell-gh]: https://github.com/sorvell
[whatwg-5401]: https://github.com/whatwg/html/issues/5401
[alice-gist]: https://gist.github.com/alice/174ae481dacdae9c934e3ecb2f752ccb
[alice-gh]: https://github.com/alice
[alice-frustration]: https://github.com/WICG/aom/issues/192#issuecomment-4552421315
[hdp]: https://www.w3.org/TR/html-design-principles/#priority-of-constituencies
[wpdp]: https://www.w3.org/TR/design-principles/#priority-of-constituencies
[eslint-wc]: https://github.com/43081j/eslint-plugin-wc/blob/main/docs/rules/no-closed-shadow-root.md
[arxenix]: https://blog.ankursundara.com/shadow-dom/
[research]: https://github.com/bennypowers/aom-reference-target-priority-of-constituencies
[combobox-pattern]: https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.1pattern/listbox-combo.html
[nolan-gh]: https://github.com/nolanlawson
[aom-192]: https://github.com/WICG/aom/issues/192
[ref-target]: https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md
[rt-tracking]: https://github.com/WICG/webcomponents/issues/1086
[nolan-warning]: https://github.com/WICG/aom/issues/192#issuecomment-4552421315
