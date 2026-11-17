/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const CHARS = /[()[\]{}«»‹›\-–—]/;
  const SPLIT = /([()[\]{}«»‹›\-–—])/;
  const SKIP = 'script, style, noscript, textarea, input, canvas, time, #clock-zone, .punct-lift';

  function wrap(node) {
    if (!CHARS.test(node.nodeValue)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const fragment = document.createDocumentFragment();
    node.nodeValue.split(SPLIT).forEach(part => {
      if (!part) return;
      if (CHARS.test(part) && part.length === 1) {
        const span = document.createElement('span');
        span.className = 'punct-lift';
        span.textContent = part;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });
    node.replaceWith(fragment);
  }

  function wrapAll(root) {
    if (root.nodeType === Node.TEXT_NODE) return wrap(root);
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrap);
  }

  function start() {
    wrapAll(document.body);
    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') wrap(mutation.target);
        mutation.addedNodes.forEach(wrapAll);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
