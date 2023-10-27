import '@shul/elements';

/** @type {NodeListOf<HTMLElement>} */
const editable = document.querySelectorAll('[contenteditable][data-storage-key]')
const fullscreen = document.getElementById('fullscreen')
const exitFullsc = document.getElementById('exit-fullscreen')

for (const field of editable) {
  const { storageKey } = field.dataset;
  const key = `shul-${storageKey}`;
  const stored = localStorage.getItem(key)
  if (stored)
    field.textContent = stored;
  field.addEventListener('input', function() {
    localStorage.setItem(key, field.textContent);
  });
}

fullscreen.addEventListener('click', async function() {
  await document.body.requestFullscreen();
});

exitFullsc.addEventListener('click', async function() {
  await document.exitFullscreen();
});

globalThis.addEventListener('fullscreenchange', onFullscreenchange)

function onFullscreenchange() {
  exitFullsc.hidden = !document.fullscreenElement;
  fullscreen.hidden = !!document.fullscreenElement;
}

onFullscreenchange();

