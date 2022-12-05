## Embedded Content {slot=heading}

The `<audio>` element provides sound playback on web pages. Like `<video>`, you 
can provide multiple sources

```html
<audio controls>
  <source type="audio/ogg" src="hatikva.ogg">
  <source type="audio/mpeg" src="hatikva.mp3">
</video>
```

<audio controls preload="none" height="32" width="220">
  <source type="audio/ogg; codecs=vorbis" src="//upload.wikimedia.org/wikipedia/commons/2/26/Hatikvah_instrumental.ogg">
  <source type="audio/mpeg" src="//upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Hatikvah_instrumental.ogg/Hatikvah_instrumental.ogg.mp3">
</audio>
