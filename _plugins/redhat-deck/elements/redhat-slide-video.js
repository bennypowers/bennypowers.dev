import { SlidemVideoSlide } from '/assets/decks.min.js';
// import style from './redhat-video-slide.css.js';
// import template from './redhat-video-slide.html.js';

/** @type{typeof import('slidem/slidem-video-slide.js').SlidemVideoSlide} */
const VideoBase = SlidemVideoSlide;

export class RedHatVideoSlide extends VideoBase {
  static is = 'redhat-video-slide';
}

customElements.define(RedHatVideoSlide.is, RedHatVideoSlide);
