/** @param {string} id */
const $ = id => document.getElementById(id);
const printBtn = $('print-button');

printBtn.addEventListener('click', window.print.bind(window));
