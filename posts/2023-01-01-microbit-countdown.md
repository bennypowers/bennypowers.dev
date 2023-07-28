---
title: Micro:bit countdown
published: true
description: Let's spice up the stock makecode countdown tutorial
coverImage: /assets/images/microbit.png
tags:
  - micro:bit
  - mentoring
---

The stock [Makecode Countdown][stock] tutorial for micro:bit v2 is relatively 
straightforward. Coders run a for loop through three iterations, each time 
displaying the count, then ending off with bang. The cleverest part is the 
realization that you can subtract the 0-based loop index from the total number 
of iterations to get a countdown, since the for-loop block is hard coded to 
increment `i`.

Let's see if we can spice this up with some user control. How would we go about 
letting the user choose which number to count down from?

Since the micro:bit's display is simple, we only want to display a single digit 
at a time, so let's not let the user count down from any number higher than 9

Think about how you'd do this for a second, then click on the spoiler button to 
reveal how I solved it.

<details><summary class="spoiler">SPOILER</summary>

First thing we'll do is move all our code out of the `on start` block and into 
an `on shake` block, since we want the count down to happen when the user 
chooses. But keep the `on start` block around, we'll use that to set a new 
variable named `count` to `1`, and display it on screen.

![Makecode editor with on start and on shake blocks][onstart]

Next, we'll program the B button to *increment* the count variable (i.e. 
increase it by one). Add an `on button [b] pressed` block, but be careful! We 
need to make sure count never exceeds `9`, so first let's add an `if` statement. 
In the predicate of the `if` statement, add a comparison operator to check that 
`count < 9`.

![Makecode editor with on button b pressed block][onbuttonb]

Duplicate that block, then modify the copy to change `count` by `-1` 
(*decrement* it) if `count` is greater than `1`.

![Makecode editor with on button a pressed block][onbuttona]

Let's also `show number [count]` after each of those button presses, so the user 
knows what the `count` is.

Out last job is to hook up `count` with our display in the `on shake` block. 
Change the `for index from 0 to [2]` to loop from `0` to `count - 1`. Why 
subtract 1? Because the index should be *0-indexed*, or count up from 0. With 
that accomplished, change the `show number [3 - index]` to
`show number [count - index]`, so that it shows how many we've counted down.

As a courtesy, let's add another `show number [count]` at the end of the shake 
block, so the user knows what their setting was.

![Makecode editor with on button a, button b, shake, and start blocks][final]

</details>

Check it out in the simulator:

<div style="position:relative;height:0;padding-bottom:81.97%;overflow:hidden;">
  <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"
          src="https://makecode.microbit.org/---run?id=_iv831cLypFH1"
          allowfullscreen="allowfullscreen"
          sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
          frameborder="0"></iframe>
</div>

Or view the [completed project][complete].

[stock]: https://makecode.microbit.org/_6CuawcE2h96F
[onstart]: {{ '/assets/images/countdown-onstart.png' | url }}
[onbuttonb]: {{ '/assets/images/countdown-onbuttonb.png' | url }}
[final]: {{ '/assets/images/countdown-final.png' | url }}
[complete]: https://makecode.microbit.org/_iv831cLypFH1

