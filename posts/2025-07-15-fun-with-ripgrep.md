---
title: Fun with Ripgrep, part 1
published: true
tags:
  - linux
  - ripgrep
  - web components
audience: unix nerds
tldr: >-
coverImage: /assets/images/ripgrep1.jpg
coverImageAlt: >-
  cartoon of doom guy from doom 2016, saying "rip and tear!!!"
---

Design systems have a tendency to get out of hand if you don't pay close attention. Ever wanted to know how many similarly-named elements you have in your repo? We need to find all tag name instancesRipgrep to the rescue! Here's the one-liner I used:

```shell
rg -Ior '$1' "<(rh-navigation(-\w+){2,})( .*)?>" | sort | uniq
```

Breakdown:

- `rg` - the ripgrep command. Rips and tears, until it's done
- `-I` - the `--no-filename` flag prevents ripgrep from printing file names, 
this is important because we don't care which filename is there, only which tag name is there
- `-o` - the `--only-matching` flag only prints the matching parts of the line, 
  this is important for the same reason as above
- `-r '$1'` - the `--replace` flag replaces the match ripgrep finds with the 
regexp expression provided, namely the (shell-escaped with `'`) first capture group, which is from...
- `<(rh-navigation-\w+-\w+)( .*)?>` - the pattern we're searching for. In my 
case, I'm looking for auxiliary elements that have to do with (but aren't equivalent) to our `<rh-navigation-*>` suite of elements.
  - the first capture group is `rh-navigation-\w+-\w+`, which means that the tag 
    name
      1. must begin with `rh-navigation-`
      2. must then be followed by a dash, followed by one or more alpha numeric character (`\w` for word chars, `+` meaning one-or-more)
      3. that "-word" pattern must repeat two-or-more times. e.g. `rh-navigation-primary-item` will match, but `rh-navigation-primary` won't
  - `( .*)?` optional attributes on the element, preceeding the closing `>`
- `| sort` - we pipe those results (tag names, no attributes, at least 4 words 
each) into the sort command, which is a necessary step before ...
- `| uniq` - we pipe the sorted results into the `uniq` command which returns 
(by default) a list of unique entries

And thus, we've discovered all the tag names in our repo which are auxiliary elements to the rh-navigation suite of elements.

<small>Cover image CC BY-NC-SA [theeysmaster](https://www.deviantart.com/theeyzmaster/art/Doom-4-640721670)</small>
