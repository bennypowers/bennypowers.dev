---
title: Hosting Firefish on a Raspberry Pi
published: true
audience: Linux nerds, Fediverse weebs, masochists.
tags:
  - fediverse
  - selfhosting
  - firefish
  - raspberrypi
  - gentoo
tldr: >
  Self-hosting the firefish fediverse microblogging app isn't as hard as you
  might think. Using Gentoo Linux and Podman on a Raspberry Pi, initial setup
  is almost entirely straightforward
coverImageAlt: >
  With a frozen antarctic vista in the background, a gentoo penguin is 
  chilling with some giant raspberries,
  with a flaming goldfish in its beak
coverImage: /assets/images/gentoo-rpi-firefish.png
---

[Firefish][firefish] is a fork of Misskey, which is a fork of Calckey, which is a fediverse microblogging app, similar to Mastodon. Since apparently [I haven't learned my lesson][lesson], let's try self-hosting a firefish instance, and see how that goes (spoiler alert: predictably awful). Interacting with social media in any form is hazardous to your mental health. The Fediverse is not immune to the excesses of device-mediated groupthink, nor is it some mythical bastion of proper discourse. However, the current crop of fediverse microblogging platforms have their fair share of moderation tools, so if you gain experience from reading this post, you'll soon be making a hobby of pasting keywords-to-mute into your moderation forms.

Follow this path if you, like me, are an aspiring misanthrope who loves frustration.

## The General Idea

We'll use a Raspberry Pi 5 single-board ARM computer, with 8gb of RAM. Four GB may be enough, depending on your use. I observed by rough average 1GB of RAM usage over the first few days. Depending on how many instances you're federated with, if you have relays connected, and how many followers you have on your instance, <abbr title="your mileage may vary">YMMV</abbr>. Once we've procured our hardware, onto which we'll install [Gentoo][gentoo] Linux and the [downstream RPI kernel][downstream]. We'll use [Podman][podman], because why use docker when you can use podman? In other words we're going to have a containerized single-instance app which should be enough for s's and g's, but might fail horribly down the line. But as my accountant always says "you should be so lucky to pay lots of taxes". If you find your puny little <abbr title="single-board computer">SBC</abbr> getting pounded by overwhelming internet popularity, follow-on configurations using <abbr title="kubernetes">k8s</abbr> and co. are searchable on GitHub.

### OS Installation
Getting gentoo fully loaded onto a raspberry pi is beyond the scope of this blog post,but [the gentoo wiki's installation guide][rpi-gentoo-install] is excellent. For the initiated, it can be helpful to start with the [stage-3 systemd tarball][stage3], and make sure to [compile in all the podman dependencies][podman-kernel] to the downstream kernel.

Since we want Podman 5 for improved health check support in systemd units, accept the `arm64` keyword in `/etc/make.conf`:

```ini
ACCEPT_KEYWORDS="~arm64"
```

## Container Setup

That having been accomplished, we'll need to set up our firefish containers. Firefish comes with a [compose file][firefish-compose], which is quite handy, and at only 78 lines, it's not exceedingly complicated. The app has three services: a postgres database, a redis cache, and a nodejs web server. We'll set up a network for them to communicate, and some volumes to hold config and data. **Note** that this guide was written with respect to the firefish repo at tag [v20240630][tag].

We could just `podman compose up` the compose file and call it a day, but y'know: systemd all the things. Gotta `systemd-coffeed`, `systemd-nailclipperd`, `systemd-existentialdreadd`, etc. Less cynically, we'll use `loginctl` to bring up our rootless firefish pod on each boot, which is handy. Again, this is something you can script without systemd, but the cult of Poettering demands obeisance, so [quadlet][quadlet] it is. We'll use [podlet][podlet], which is a program that can turn a [compose file][compose] into systemd services.

### Composefile mods
As it happens, quadlet complains about several aspects of our compose file:

> ```
> ❯ podlet compose
> Error: 
>    0: error converting compose file
>    1: error converting compose file into Quadlet files
>    2: error adding dependency on `db` to service `firefish-web`
>    3: dependency condition `service_healthy` is not directly supported
>
> Location:
>    /home/whomsoever/.cargo/registry/src/index.crates.io-6f17d22bba15001f/podlet-0.3.0/src/cli/unit.rs:156
>
> Suggestion: try using `Notify=healthy` in the [Container] section of the dependency
>
> Backtrace omitted. Run with RUST_BACKTRACE=1 environment variable to display it.
> Run with RUST_BACKTRACE=full to include source snippets.
> ```

And who are we to argue? We'll have to make some modifications. Remove the `service_healthy` condition and replace them with a list of container names

```diff-yaml
-web:
+firefish-web:
   image: registry.firefish.dev/firefish/firefish:latest
-  container_name: firefish_web
+  container_name: 'firefish-web'
   restart: unless-stopped
   depends_on:
+    - 'firefish-db'
+    - 'firefish-redis'
-    db:
-      condition: service_healthy
-    redis:
-      condition: service_healthy
```

Having modified upstream's compose file to suit podlet's tastes, let's run the command to generate our services:

```sh
podlet compose
```

Copy the outputs to files in `~/.config/containers/systemd/firebase-web.container`, etc, being sure to add the condition above to each unit

```systemd
[Container]
Notify=healthy
```

Next we need to set up the postgres database, which requires an extention called (and, please I'm asking you to say this out loud right now) `pgroonga`. In order to do this, we first have to start the service once so that it creates the container.

```sh
systemctl --user start firefish-db
podman exec -it firefish-db sh -c 'psql \
  --user="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --command="CREATE EXTENSION pgroonga;"'
```

That step should really be baked into the `pgroonga` image, if you ask me, but no matter. If you entered the `CREATE` command interactively, <kbd>ctrl</kbd>-<kbd>d</kbd> out of the sql prompt, then we need to add some config.

#### Troubleshooting

At a certain point I had an issue with the DB container's health check command. Running the health check command manually worked:

```sh
podman exec -it firefish-db sh -c 'pg_isready \
--user="$POSTGRES_USER" \
--dbname="$POSTGRES_DB"'
```
So I started the service then inspected the container to read the health check's output

```sh
❯ podman inspect firefish-db | jq .[].State.Health.Log
[
  {
      "Start": "2024-07-08T00:40:20.74269814+03:00",
      "End": "2024-07-08T00:40:20.842938674+03:00",
      "ExitCode": 1,
      "Output": "/bin/sh: syntax error: unterminated quoted string"
  }
]
```

Seems like I needed to adjust the syntax in the `HealthCmd` field.

### App config

Create an env file and a firefish config yaml so we can configure our instance

```sh
mkdir -p ~/.config/firefish
touch ~/.config/firefish/env
touch ~/.config/firefish/default.yml
```

Copy in the [configuration from the firefish repo][config] (you want the `docker_example.env` and `example.yml` files) and modify them to suit your needs. Make sure to set permissions appropriately! Should look like this when you're done:

```
$ ls -ln ~/.config/firefish/
total 12
-rw------- 1 1000 1000 6050 Jul 9 06:13 default.yml
-rw------- 1 1000 1000  220 Jul 9 06:13 env
```

Be sure to modify the volume bindings appropriately as well, and set the `EnvironmentFile` key to point to `~/.config/firefish/env`;

## Giv'er
All we have to do now is start the service

```
systemctl --user start firefish-web
```

And as they say, "zehu!", we now have firefish running locally. Fill out the onboarding survey, create an account, and start recklessly opining! If you want to attach it to a domain name, use cloudflared, dyndns, or run a reverse proxy, etc, but that's out of scope of this tutorial.

[firefish]: https://firefish.dev/firefish/firefish
[tag]: https://firefish.dev/firefish/firefish/-/tags/v20240630
[gentoo]: https://gentoo.org
[downstream]: https://github.com/raspberrypi/linux
[lesson]: /posts/leaving-mastodon/
[podman]: https://podman.io
[quadlet]: https://www.redhat.com/sysadmin/quadlet-podman
[podlet]: https://github.com/containers/podlet
[compose]: https://github.com/compose-spec/compose-spec
[stage3]: https://www.gentoo.org/downloads/#arm64-advanced
[podman-kernel]: https://wiki.gentoo.org/wiki/Podman#Kernel
[rpi-gentoo-install]: https://wiki.gentoo.org/wiki/Raspberry_Pi_Install_Guide
[firefish-compose]: https://firefish.dev/firefish/firefish/-/blob/develop/docker-compose.example.yml?ref_type=heads
[config]: https://firefish.dev/firefish/firefish/-/tree/develop/.config?ref_type=heads
