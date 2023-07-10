---
title: Debugging GNOME Extensions with dbus-run-session
published: true
description: >
  How to run a nested gnome session (wayland) so you can test out 
  changes to a GNOME extension without having to log out.
datePublished: 2023-07-10
coverImage: /assets/images/gnome-ai-nightmare.png
coverImageAlt: >
  a generative ai nightmare for which the prompt was:
  "garden gnome gets stretched out from head to toe"
tags:
  - GNOME
---

[GNOME extensions][ego] let you customize the way your desktop environment 
works. You can use them to do things like always keep a certain type of window
on top of the others, automatically tile windows, add eye candy to the overview,
and much more. They are written in a type of JavaScript called gjs.

I learned a trick for developing GNOME extensions which saved me a bunch of time
and hassle. Before I learned how to do this, I would have to log out and back in
for every change I made to the extension - there's no built-in way to "reload"
extensions in GNOME. With this technique, instead of logging out, I create a
new, nested GNOME session and run the latest code from the extension I'm working 
on in there.

When you're ready to test, all you have to do is:
1. package up your extension in a zip file as usual,
2. install the new version,
3. launch a nested session, and
4. test your code.

Here's how that looks for my "Firefox PiP Always on Top" extension:

```bash
npm run build; # zip up the extension
gnome-extensions install --force ./firefox-pip@bennypowers.com.zip; # install
dbus-run-session gnome-shell --nested --wayland; # run a new session
```

Note the `--force` flag when installing to make sure the old version is
overwritten.

I hope this quick tip helps you to build and share your GNOME extensions.

[ego]: https://extensions.gnome.org
