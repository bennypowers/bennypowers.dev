module.exports = class Webfinger {
  data() {
    return {
      permalink: '.well-known/webfinger',
    };
  }

  render({ webfinger }) {
    return JSON.stringify(webfinger);
  }
}
