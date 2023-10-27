/** @type {NodeListOf<HTMLElement>} */
const editable = document.querySelectorAll('[contenteditable][data-storage-key]')
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
