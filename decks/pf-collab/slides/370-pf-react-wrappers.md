## PatternFly Elements - react wrappers {slot=heading}

<span slot=notes>stress that react wrappers is a react problem</span>

<div id="demo">
  <pf-button onclick="this.nextElementSibling.src=this.nextElementSibling.dataset.src;this.hidden=true;">Load Demo</pf-button>
  <iframe width="100%"
          data-src="https://codesandbox.io/p/sandbox/pfe-react-wrappers-3g6x6r?embed=1&file=src/App.tsx"
          loading="lazy"
          allowfullscreen></iframe>
</div>

<style>
#slide-body {
  padding: 0 !important;
}
#demo {
  display: grid;
  grid-template-areas: 'all';
  place-items: center;
}
#demo > * {
  grid-area: all;
}
iframe {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius:2px;
  height: 80vh;
}
</style>
