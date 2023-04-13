---
title: Wrapping Emoji in your 11ty build
published: true
description: Wrap emoji with accessible and semantic HTML, without breaking your pages
tldr: >
  Wrapping emoji in element with #aria-label is an #accessibility practice 
  recommended by experts like Leonie Watson. This post builds on work by Kitty 
  Giraudel and others in automatically wrapping emoji in your #11ty/#eleventy 
  pages.
coverImage: /assets/images/emoji-sticker.png
coverImageAlt: dozens of emoji stickers piled one on top of the other
datePublished: 2023-04-13
tags:
  - eleventy
  - html
  - accessibility
---

[Léonie Watson recommends wrapping emoji][leonie] in a span with an aria-label. 
On our 11ty pages, we can use the [`addTransform` API][addTransform] to 
post-process all of our HTML pages. [Kitty Giraudel wrote a short transform 
function][kitty] which accomplishes the task well in most cases.

In addition to the accessibility improvement, I use CSS text clip to fancy up 
some of the links and headings on my pages. [Geoff Graham explains that there's 
not yet a CSS-native way][csstricks] to exclude emoji from that hack, so 
wrapping them up lets me target them with CSS.

But what do you do when emoji land on your page as part of the alt-text of 
images delivered through third-party services? In my case, I might get mastodon 
avatars via [webmention.io][wmio]. If you apply the simple `content.replace` 
method, you'll end up with broken HTML.

```html
<header class="p-author h-card">
  <a target="_blank" rel="noopener" href="https://social.bennypowers.dev/@bp" class="avatar">
    <img src="https://webmention.io/avatar/yadda-yadda"
         title="Benny Powers <span class="emoji" role="img" aria-label="flag: Canada" title="flag: Canada">🇨🇦</span>️<span class="emoji" role="img" aria-label="flag: Israel" title="flag: Israel">🇮🇱</span>️">
  </a>
```

Yikes! In order to avoid this problem we have to parse the HTML first and only 
replace emojis we find within text nodes. Let's use [Andrea Giammarchi's 
Linkedom][linkedom], as well as his `emoji-short-name` library, to build upon 
Kitty's solution from above:

```js
const getRegex = require('emoji-regex')
const names = require('emoji-short-name')

const linkedom = require('linkedom');

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig, { exclude }) {
  eleventyConfig.addTransform('emojis',
    /** @param {string} content */
    function (content) {
      if (!this.page.outputPath.endsWith?.('.html') || (exclude && this.page.outputPath.match?.(exclude))) {
        return content;
      } else {
        const RE = getRegex();
        const { document, Node } = linkedom.parseHTML(content);
        document.querySelectorAll(':is(a, h1, h2, h3, h4, h5, h6, .magic-color, p)').forEach(el => {
          el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.match(RE)) {
              const cont = document.createElement('div');
              cont.innerHTML = node.nodeValue.replace(RE, emoji =>
                `<span class="emoji" role="img" aria-label="${names[emoji] ?? 'unknown emoji'}">${emoji}</span>`);
              node.replaceWith(...cont.childNodes);
            }
          });
        });
        return document.toString();
      }
    });
}
```

So for every HTML file written by 11ty that's not matched to the `exclude` 
pattern, we'll create a server-side DOM with linkedom, then for each header, 
paragraph, or element using the background clip hack; for each of it's text node 
children; if the node contains an emoji, we'll replace that node with a new list 
of nodes. In the new node list, each emoji character is a new `HTMLSpanElement` 
node bearing the appropriate attributes.

This way our emoji will pop out both visually and auditorially, while reducing 
the chance we'll breaking the page in unexpected ways.

[leonie]: https://tink.uk/accessible-emoji/
[addTransform]: https://www.11ty.dev/docs/config/#transforms
[kitty]: https://kittygiraudel.com/2021/01/02/accessible-emojis-with-11ty/
[csstricks]: https://css-tricks.com/excluding-emojis-from-transparent-text-clipping/
[wmio]: https://webmention.io/
[linkedom]: https://github.com/WebReflection/linkedom
