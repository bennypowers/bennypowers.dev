---
title: How I broke Dev.to on my First PR
published: true
description: A tale of two face-palms
date: 2018-09-17
tags:
  - beginners
  - devops
  - ruby
---

Today I made my first PR to dev.to, which lets you [add options to glitch embeds](https://github.com/thepracticaldev/dev.to/pull/680). I struggled to install the requirements and build the app, wrote unit tests for the new features, learned my first bits of ruby, and after a few hours of playtime, submitted the PR. It was quickly accepted, ✨THANKS, @ben!🌟

That's when I noticed that every single glitch embed on the entire site was broken 

![🤦‍♂️](https://media.giphy.com/media/3og0INyCmHlNylks9O/giphy.gif)

Thanks to @rhymes, for pointing the problem out:

https://dev.to/rhymes/comment/5hgh

The solution was as face-palmy as the bug itself: I left out the `#` which designates an interpolation in ruby strings:

```diff
-    src={@uri}
+    src=#{@uri}
```

A fun learning exercise for me. I sincerely hope that my oversight didn't cause any inconvenience.

New PR is in flight, once the fix is live I'll write a regression test.

https://github.com/thepracticaldev/dev.to/pull/683
