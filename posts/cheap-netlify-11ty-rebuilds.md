---
title: Cheaply Rebuilding an 11ty site on Netlify
published: true
description: >
  Save money and build minutes while rebuilding your 11ty site using GitHub 
  Actions and the netlify CLI
datePublished: 2023-01-31
coverImage: /assets/images/duck-coins.jpg
coverImageAlt: >
  rich duck, diving into a pool of gold coins, in the style of 90s saturday 
  morning cartoons
tags:
  - eleventy
  - github
  - performance
---

So, you read [Robb Knight's lovely article on implementing Webmentions][rknight] 
on your 11ty site, and you even wrote some code to fetch reactions from brigdy 
and webmention.io; good for you! Thing is, Netlify provides 300 free build 
minutes per month, and it takes about a minute to build your site, door-to-door. 
That's about 720 minutes a month, or in layman's terms: [$7][pricing] you could 
be spending on bourbon, or Nintendo games, or, I dunno, rent or something.

Luckily, our Cascadian software overlords in Redmond have deep pockets, and 
GitHub actions minutes are basically free. So instead of building our site on 
netlify's runners, let's build the site on their servers and just ship the 
`_site` dir to netlify to deploy. How? Easy-peasy:

Make `.github/workflows/rebuild.yaml` and plop this jaunty little ditty inside:

{%raw%}
```yaml
name: Rebuild

on:
  workflow_dispatch:
  schedule:
    - cron: '0 * * * *'

jobs:
  rebuild:
    runs-on: ubuntu-latest
    name: Rebuild site
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci --prefer-offline
      - run: npm run build

      - name: Publish to Netlify
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        run: npx netlify-cli deploy --prod --message "deploy from GitHub Action" --dir=_site
```
{%endraw%}

Let's break this down:

1. `workflow_dispatch` means the action runs whenever you click the right 
buttons in the GitHub web UI or by hitting a special URL GitHub generates. We 
can use that URL later on the rebuildPAT automatically whenever we get an 
incoming webmention.

1. `schedule` uses cron tab notation `0 * * * *` to run every hour on the 0th 
minute, or if you're normal "once every hour".

1. We grab our site's UUID from the netlify web UI at 
`https://app.netlify.com/sites/${your_site_slug}/settings/general` and save it 
as a GitHub secret called `NETLIFY_SITE_ID`.

1. Likewise, we generate a <abbr title="personal access token">PAT</abbr> on the 
[netlify user settings page][user] and save it under `NETLIFY_AUTH_TOKEN`.

If your build uses any other env vars (for example `WEBMENTION_IO_TOKEN`), make 
sure to save those in GitHub as well. I mean, we might as well spread our 
secrets around _amirite_?

That having been accomplished, run the `netlify-cli` <abbr title="node package 
manager">NPM</abbr> package with the `--prod` flag to deploy to the main site 
and the `--message` flag to help our future selves understand just what's flying 
here.

How'd we do?

![Production published deploy from GitHub Action Today at 7:25 PM Deployed in 
9s]({{ '/assets/images/netlify-deploy-time-vs-build.png' }})

Not too shabby! With this trick we cut our build time down by about a fifth. If 
deploys take on average 15 seconds, and we automatically rebuild on the hour, 
that gives us a headroom of about 120 build minutes for regular `main` branch 
deploys and branch deploy previews.

[rknight]: https://rknight.me/adding-webmentions-to-your-site/
[pricing]: https://www.netlify.com/pricing/
[user]: https://app.netlify.com/user/applications
