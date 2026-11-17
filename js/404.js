/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  document.addEventListener('click', event => {
    if (event.target.closest('#home-link')) event.stopPropagation();
  }, true);

  // Centred, but never over the bio: in very small windows it sits two lines under it.
  const message = document.querySelector('.not-found');
  const bio = document.querySelector('.bio h1, .bio p');
  function place() {
    if (!message || !bio) return;
    message.style.top = '';
    const line = parseFloat(getComputedStyle(message).lineHeight) || 15;
    const lowest = bio.getBoundingClientRect().bottom + 2 * line + message.offsetHeight / 2;
    if (lowest > window.innerHeight / 2) message.style.top = `${lowest}px`;
  }
  place();
  window.addEventListener('resize', place);
  window.addEventListener('load', place);
})();
