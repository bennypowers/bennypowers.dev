import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.83/dist/components/icon/icon.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.83/dist/components/icon-button/icon-button.js';
import { registerIconLibrary } from 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.83/dist/utilities/icon-library.js';

registerIconLibrary('default', {
  resolver: (name) => `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.0.0/icons/${name}.svg`
});

const $ = id => document.getElementById(id);
const printBtn = $('print-button');

printBtn.addEventListener('click', window.print.bind(window));

class Scroller {
  static instance;

  static style = getComputedStyle(document.documentElement)

  static initialize() {
    const scroller = new Scroller();
    scroller.onResize();
    window.addEventListener('scroll', scroller.onScroll.bind(scroller));
    scroller.animateHue();
  }

  constructor() {
    return Scroller.instance ??= this;
  }

  hueStart = Number(Scroller.style.getPropertyValue('--hue-start'));

  hueEnd = Number(Scroller.style.getPropertyValue('--hue-end'));

  scrollPosition = {scrollTop: 0, scrollLeft: 0};

  lastPosition = {scrollTop: 0, scrollLeft: 0};

  lastHue = this.hueStart;

  maxScroll = {
    scrollTop: document.body.scrollHeight - window.innerHeight,
    scrollLeft: document.body.scrollWidth - window.innerWidth
  };

  hueFromScrollPosition(scroll = this.scrollPosition) {
    const position = scroll.scrollTop;
    const boundary = this.maxScroll.scrollTop;
    const scrollFactor = position / boundary;
    const delta = (this.hueEnd - this.hueStart) * scrollFactor;
    const hue = this.hueStart + delta;
    return hue;
  }

  hasScrollChanged() {
    return this.scrollPosition.scrollLeft !== this.lastPosition.scrollLeft || this.scrollPosition.scrollTop !== this.lastPosition.scrollTop;
  }

  onResize() {
    const scrollLeft = document.body.scrollWidth - window.innerWidth;
    const scrollTop = document.body.scrollHeight - window.innerHeight;
    Object.assign(this.maxScroll, {scrollLeft, scrollTop});
  }

  animateHue() {
    if (this.hasScrollChanged()) {
      const hue = this.hueFromScrollPosition(this.scrollPosition);
      if (this.lastHue !== hue)
        document.documentElement.style.setProperty('--primary-hue', hue.toString());
      this.lastHue = hue;
    }
    Object.assign(this.lastPosition, this.scrollPosition);
    requestAnimationFrame(this.animateHue.bind(this));
  }

  onScroll() {
    const {scrollLeft, scrollTop} = document.documentElement;
    Object.assign(this.scrollPosition, {scrollLeft, scrollTop});
  }
}

Scroller.initialize();

if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('service-worker.js');

