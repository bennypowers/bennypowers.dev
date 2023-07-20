## Web components {slot=heading}

<div id="technologies">
  <figure-img src="images/code.svg" alt="angle brackets, representing html code" height="150">Custom Elements</figure-img>
  <figure-img src="images/container.svg" alt="hexagon, representing encapsulation" height="150">Shadow DOM</figure-img>
  <figure-img src="images/stack.svg" alt="stacked platforms, representing templates" width="150"><code>&lt;template></code></figure-img>
  <figure-img src="images/ship.svg" alt="cargo ship, representing modules" height="150">JavaScript Modules</figure-img>
</div>

<div id="uses" reveal>

  - Apps (<abbr title="single page application">SPA</abbr>s or <abbr 
    title="multipage application">MPA</abbr>s)
  - Design systems
  - Micro-frontends

  <img alt="puzzle piece"
       src="images/puzzle.svg">
</div>

Good for leaf nodes and for page views
Good for design systems and one-offs
Good for heavy client side apps and lightweight server-rendered pages
{slot=notes}

<style>
  p { display: contents; }

  #technologies {
    display: flex;
    place-content: start center;
    max-width: 100%;
    margin-inline: auto;
    gap: 40px;
  }

  figure-img {
    --caption-align: center;
    --margin: 0;
    font-size: 1.5em;
  }

  @media (width <= 500px) {
    #technologies {
      gap: 10px;
    }
    figure-img {
      scale: .75;
    }
  }

  #uses {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #uses img {
    max-height: 40vh;
    aspect-ratio: 1;
  }
</style>
