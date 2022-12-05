## What is CSS? {slot=heading}

### Logical Properties

CSS Provides **logical box-model** properties which make your layouts more 
resiliant and internationalizable. Instead of referring to directions `top`, 
`right`, `left`, `bottom`, we have the `block` and `inline` axes and the `start` 
and `end` directions:

`top`
~ `block-start`

`right`
~ `inline-end`

`left`
~ `inline-start`

`bottom`
~ `block-end`

<figure>
  <p>LTR
    <span class="block-axis">Block</span>
    <span class="inline-axis">Inline</span>
  </p>
  <p dir="rtl">RTL
    <span class="block-axis">Block</span>
    <span class="inline-axis">Inline</span>
  </p>
  <figcaption>
    Start: <span class="start">⇨</span>
    End: <span class="end">⇦</span>
  </figcaption>
</figure>
