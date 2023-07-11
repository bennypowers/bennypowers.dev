## Web Component Core Technologies {slot=heading}

<figure-img src="ce.svg" alt="painter's palette" height="150">Custom Elements</figure-img>
<figure-img src="sd.svg" alt="sunglasses" height="150">Shadow DOM</figure-img>
<figure-img src="te.svg" alt="rubber stamp" width="150"><code>&lt;template></code></figure-img>
<figure-img src="esm.svg" alt="transport truck" height="150">JavaScript Modules</figure-img>

<style>
#contents {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  place-content: start center;
  width: max-content;
  margin-inline: auto;
  column-gap: 40px;
}
figure-img {
  --caption-align: center;
  --margin: 0;
  font-size: 1.5em;
}
@media (width <= 500px) {
  #contents {
    grid-template: 1fr 1fr / 1fr 1fr;
    column-gap: 0;
  }
  figure-img {
    scale: .75;
  }
}

</style>
