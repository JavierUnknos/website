/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const html = document.documentElement;
  const FADE_TIME = 350;

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-fade]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    html.classList.add('is-leaving');
    setTimeout(() => { window.location.href = link.href; }, FADE_TIME);
  });

  window.addEventListener('pageshow', () => html.classList.remove('is-leaving'));

  if (html.classList.contains('is-entering')) {
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('is-entering')));
  }
})();
