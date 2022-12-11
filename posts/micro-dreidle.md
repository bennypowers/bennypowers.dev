---
title: Make a Micro Dreidle
published: true
description: Let's use makecode to turn a micro:bit into a dreidle!
datePublished: 2022-12-12
coverImage: /assets/images/micro-dreidle.png
tags:
  - micro:bit
  - mentoring
  - hannukah
---

Let's use [makecode][mc] to turn a [micro:bit][mb] into a dreidle!

Micro:bit is a tiny opensource device designed and sold by the BBC. It's made to 
teach computing and electical engineering concepts to students of all ages and 
it's a treat to hack around with.

A dreidle is a four-sided top marked with the Hebrew letters <bdi>נ</bdi>, 
<bdi>ג</bdi>, <bdi>ה</bdi>, and <bdi>פ</bdi>. You use it to trick Seleucid Greek 
Gestapo into thinking you're gambling when you're really clandestinely learning 
Torah. 

Clearly, these two things were made to be one.

## Sevivon, Sov Sov Sov

Let's start a new project and flip to the JavaScript editor (which is actually a 
typescript editor but who's counting?), since posting code blocks is easier than 
taking screen shots 😄.

The plan is to use the <abbr title="random number generator">RNG</abbr> to 
simulate a <i>drey</i> (spin) of the dreidle, picking a number from 0-3, then 
depending on which number we get, we'll display a different letter on the 
screen.

Let's start by generating a random number whenever we shake the micro:bit, and 
storing it in a variable called `pan`, which means "face" in Hebrew, as in the 
face the dreidle landed facing up.

```ts
function drey() {
  const pan = Math.randomRange(0, 3);
}

input.onGesture(Gesture.Shake, drey);
```

That having been accomplished, let's then display a given glyph. Since we're 
using the JavaScript editor we're less encumbered, ~~so we can use a number of 
JavaScript constructs to pick and show our glyph~~ LOL nope, we still have to 
pass string literals to `showLeds`, so our JS code will still be very congruent 
with blocks code. If we were using the blocks editor, we'd need to use the `if / 
then / else` block and drag in and duplicate "Show LEDs" blocks, which we'll 
also more-or-less be doing here, but at least we'll get to use `switch`

```ts
function drey() {
  const pan = Math.randomRange(0, 3);
  switch (pan) {
    case 0:
      return basic.showLeds(` ..#..
                              ...#.
                              ...#.
                              ...#.
                              .###.`);

    case 1:
      return basic.showLeds(` ..#..
                              ...#.
                              ...#.
                              ...#.
                              .##.#`);

    case 2:
      return basic.showLeds(` #####
                              ....#
                              ....#
                              #...#
                              ##..#`);

    case 3:
      return basic.showLeds(` #####
                              .#..#
                              .##.#
                              ....#
                              #####`);
  }
}
```

Honestly, if someone sent you a PR like that... I'm telling you those Greeks 
won't know what hit 'em. 🤔 I wonder if we could hack around makecode's 
requirement to use a template literal by passing a tagged template literal?

![Only image literals (string literals) supported here; TaggedTemplateExpression][bummer]

Hmm, guess not. 🤷.

## Adding Sounds

Fine, the dreidle spins, but where's the *pathos*? Let's play a crushing dirge 
when we lose a throw, and the twinkling melody of gold coins when we take the 
pot:

```ts
case 0:
  music.playSoundEffect('sad', SoundExpressionPlayMode.InBackground);
```
```ts
case 1:
  music.playSoundEffect('twinkle', SoundExpressionPlayMode.InBackground);
```

Now comes the fun part. When we tap the micro:bit's logo, let's play a little 
ditty to remind ourselves (and any adults who happen to be in earshot) precisely 
which holiday is approaching, in case it wasn't already clear to them.

I haven't figured out how to define your own melodies using the keyboard inputs, 
so let's just play the notes one by one:

```ts
function sevivon() {
  music.playTone(Note.D, 200);
  music.rest(40);
  music.playTone(Note.D, 200);
  music.rest(40);
  music.playTone(Note.E, 480);

  music.playTone(Note.F, 200);
  music.rest(40);
  music.playTone(Note.F, 200);
  music.rest(40);
  music.playTone(Note.E, 480);

  music.playTone(Note.A, 200);
  music.rest(40);
  music.playTone(Note.A, 200);
  music.rest(40);
  music.playTone(Note.G, 480);

  music.playTone(Note.F, 200);
  music.rest(40);
  music.playTone(Note.F, 200);
  music.rest(40);
  music.playTone(Note.E, 480);
}

input.onLogoEvent(TouchButtonEvent.Pressed, sevivon);
```

This way, if any of Antiochus' Nazi thugs try to interuppt our holy game of 
craps, we'll just tap the logo again and again until they're driven away by 
sheer bloopety bleepety annoyance. Brilliance!

<details>

<summary>Grab the final code here 👇</summary>

```ts
function sevivon() {
    music.playTone(Note.D, 200)
    music.rest(40)
    music.playTone(Note.D, 200)
    music.rest(40)
    music.playTone(Note.E, 480)

    music.playTone(Note.F, 200)
    music.rest(40)
    music.playTone(Note.F, 200)
    music.rest(40)
    music.playTone(Note.E, 480)

    music.playTone(Note.A, 200)
    music.rest(40)
    music.playTone(Note.A, 200)
    music.rest(40)
    music.playTone(Note.G, 480)

    music.playTone(Note.F, 200)
    music.rest(40)
    music.playTone(Note.F, 200)
    music.rest(40)
    music.playTone(Note.E, 480)
}

function drey() {
    switch (Math.randomRange(0, 3)) {
        case 0:
            music.playSoundEffect('sad', SoundExpressionPlayMode.InBackground);
            return basic.showLeds(` ..#..
                                    ...#.
                                    ...#.
                                    ...#.
                                    .###.`);

        case 1:
            music.playSoundEffect('twinkle', SoundExpressionPlayMode.InBackground);
            return basic.showLeds(` ..#..
                                    ...#.
                                    ...#.
                                    ...#.
                                    .##.#`);

        case 2:
            return basic.showLeds(` #####
                                    ....#
                                    ....#
                                    #...#
                                    ##..#`);

        case 3:
            return basic.showLeds(` #####
                                    .#..#
                                    .##.#
                                    ....#
                                    #####`);
    }
}

input.onGesture(Gesture.Shake, drey);
input.onLogoEvent(TouchButtonEvent.Pressed, sevivon);
```

</details>

Take it for a spin (🥁) in the simulator:

<div 
style="position:relative;height:0;padding-bottom:81.97%;overflow:hidden;"><iframe 
style="position:absolute;top:0;left:0;width:100%;height:100%;" 
src="https://makecode.microbit.org/---run?id=_bKbXU14odghK" 
allowfullscreen="allowfullscreen" sandbox="allow-popups allow-forms 
allow-scripts allow-same-origin" frameborder="0"></iframe></div>

Or take a look at a [blocks version for younger kids][blocks].

[mc]: https://makecode.microbit.org
[mb]: https://microbit.org
[bummer]: {{ '/assets/images/makecode-show-leds-bummer.png' | url }}
[blocks]: https://makecode.microbit.org/_iEzhbLePKbD3
