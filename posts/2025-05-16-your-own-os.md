---
title: Writing your own OS in 100 lines of YAML
published: true
tags:
  - linux
audience: os weebs
tldr: >-
  The BlueBuild project is an easy and fun way to customize your own operating
  system.
coverImage: /assets/images/blue-build.webp
coverImageAlt: >-
  A cheeky goose runs away from a workshed with a stolen spanner,
  in the background, the human owner gives chase.
---

There's a new [Hyprland release](https://hyprland.org/news/update49/) that I wanted to check out. It's supposed to have perf gains, and I like the idea of tiling WMs in general. Sadly, I couldn't (yet) get it to compile on my gentoo (actually) raspberry pi 5s, so I thought "why not install it on my fedora main?" Only problem is that my fedora main is running Silverblue, and the OS filesystem is read-only, so I'll need a pre-made operating system image configured to run Hyprland.

As it turns out, such an image already exists, and it's maintained by the [wayblue](https://github.com/wayblueorg/wayblue) project. Their Hyprland config comes bundled with a small handful of popular programs like `swaybg`, etc. But the whole fun of Hyprland is in choosing your own components and building your own config. Plus which, the new version of Hyprland hasn't quite landed in wayblue yet, so I'll have to roll my own.

Luckily, the [Blue Build](https://blue-build.org/) project, on which wayblue is built, makes it super-easy to do that!

All I had to do was fork their GitHub template, mark the wayblue/hyprland image as the base, and configure my customizations. Namely,

1. Uninstall the pre-packaged versions of hyprland and some dependencies
1. Configure [solopasha's Hyprland COPR repo](https://copr.fedorainfracloud.org/coprs/solopasha/hyprland/)
1. Install my customizations

Now, in practise, it took the better part of a day and 30 commits until the automated build finally ran to completion, on account of some minor dependency hell, but I figure that's just the cover charge for a hyprland install.

In the end, it took about [a hundred lines of yaml](https://github.com/bennypowers/hyprland-atomic/blob/b922bc1505e19bba850b96271e4b836405803f11/recipes/recipe.yml) to configure a basic, up-to-date atomic hyprland OS image. If you want to try it out, follow the [rebase instructions in the README](https://github.com/bennypowers/hyprland-atomic?tab=readme-ov-file#installation). 

After booting up and poking around for an hour or two though, I went back to stock GNOME, for the following reasons:

1. I like GNOME (actually)
1. The freedesktop stuff necessary to make deskflow/input-leap/barrier/synergy work [isn't ready yet](https://github.com/hyprwm/xdg-desktop-portal-hyprland/pull/268)
1. adwaita apps rendering with GTK 3 themes
1. my fingers and wrists are aching from RSI, so further ricing will have to wait

Down the line, after that PR is merged and released, I'd like to try again, and add some more fun:

- SDDM theme baked into the image via blue build
- eww bar instead of waybar
- light/dark modes

