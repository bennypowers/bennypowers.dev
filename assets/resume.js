/** @param {string} id */
const $ = id => document.getElementById(id);
const printBtn = $('print-button');
const details = /** @type {HTMLDetailsElement} */ ($('contact-disclosure'));

printBtn.addEventListener('click', window.print.bind(window));

matchMedia('print').addEventListener('change', function({ matches }) {
  details.open = matches;
})
