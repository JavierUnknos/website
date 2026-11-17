/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const JU = window.JU || {};
  if (!JU.setView) return;

  const body = document.body;
  const html = document.documentElement;
  const root = document.documentElement.style;

  const phone = window.matchMedia('(max-width: 700px), (pointer: coarse) and (max-height: 500px)');
  const px = value => `${Math.round(value)}px`;
  const line = 15;
  const margin = 10;
  const rowStep = 2 * line;

  const bio = document.querySelector('.bio h1');
  const homeLink = document.getElementById('home-link');
  const rest = document.createElement('span');
  rest.className = 'bio-rest';
  while (homeLink.nextSibling) rest.appendChild(homeLink.nextSibling);
  bio.appendChild(rest);

  const menuLine = document.createElement('p');
  menuLine.className = 'm-menu';
  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'm-menu-toggle';
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = '[Menu]';
  menuLine.appendChild(menuButton);
  document.querySelector('.menu').before(menuLine);

  const isMenu = () => body.classList.contains('is-menu');
  const view = () => JU.getView();

  const contact = document.querySelector('.menu .contact');
  const bars = [document.querySelector('.toolbar'), document.querySelector('.footer')];

  const SWAP_TIME = 150;
  let buttonAt = null;
  let swapTimer = null;

  let bioWasOpen = null;

  function placeButton(top, glide) {
    const text = isMenu() ? '[X]' : '[Menu]';
    if (top === buttonAt) {
      if (!menuLine.classList.contains('is-swapping')) menuButton.textContent = text;
      return;
    }
    buttonAt = top;
    clearTimeout(swapTimer);
    menuLine.classList.toggle('m-glide', glide);
    if (glide) {
      menuLine.classList.remove('is-swapping');
      root.setProperty('--m-btn-top', px(top));
      menuButton.textContent = text;
      return;
    }
    if (html.classList.contains('m-loading') || !menuLine.offsetParent) {
      root.setProperty('--m-btn-top', px(top));
      menuButton.textContent = text;
      return;
    }
    menuLine.classList.add('is-swapping');
    swapTimer = setTimeout(() => {
      root.setProperty('--m-btn-top', px(buttonAt));
      menuButton.textContent = isMenu() ? '[X]' : '[Menu]';
      menuLine.classList.remove('is-swapping');
    }, SWAP_TIME);
  }

  function layout() {
    if (!html.classList.contains('is-phone')) return;
    const v = view();
    const menu = isMenu();
    const about = v === 'about' && !menu;

    const bioOpen = v === 'home' || about || menu;

    const width = html.clientWidth;
    const middle2 = Math.round(width / 2);
    const mail = contact.querySelector('.contact-links a');

    const contactWidth = 2 * line + 8 + (mail ? mail.getBoundingClientRect().width : 0);
    const aboutTitle = document.querySelector('#about-toggle');
    const aboutEnd = aboutTitle ? margin + aboutTitle.scrollWidth : width / 3;
    let col2 = Math.min(middle2, width - margin - contactWidth);
    const stack = col2 - aboutEnd < 2 * line + margin;
    if (stack) col2 = middle2;
    html.classList.toggle('m-stack', stack);
    html.classList.toggle('m-bio-open', bioOpen);
    const bioFull = bio.scrollHeight;
    const bioBottom = margin + (bioOpen ? bioFull : line);

    const middle = Math.max(bioBottom + 2 * line, Math.round(html.clientHeight / 2 - line / 2));
    let buttonTop = margin;
    if (about || menu) buttonTop = bioBottom + line;
    else if (v === 'home') buttonTop = middle;

    const firstRow = margin + line + 2 * line;
    let menuTop = firstRow;

    if (menu || v === 'home') menuTop = bioBottom + line + line + margin;
    else if (about) menuTop = buttonTop + line + margin - 2 * rowStep;
    const aboutRow = buttonTop + line + margin;
    const contactLines = 6 + (stack ? 2 : 0);
    root.setProperty('--m-bio-h', px(bioOpen ? bioFull : line));
    placeButton(buttonTop, bioWasOpen !== null && bioWasOpen !== bioOpen);
    bioWasOpen = bioOpen;
    root.setProperty('--m-menu-top', px(menuTop));
    root.setProperty('--m-panel-top', px(aboutRow + contactLines * line + rowStep));

    root.setProperty('--m-col1', px(col2 - margin));
    root.setProperty('--m-col2', px(col2));
    const labelsTop = firstRow;
    const labelsBottom = labelsTop + rowStep + labelLines() * line;
    const carouselTop = labelsBottom + margin;
    root.setProperty('--m-labels-bottom', px(labelsBottom));
    const barsTop = Math.min(...bars.map(bar => bar.getBoundingClientRect().top));
    root.setProperty('--m-labels-top', px(labelsTop));
    root.setProperty('--m-carousel-top', px(carouselTop));
    // ends ~14px above the caps of the bottom bar, the same gap as the label baseline to the strip
    const carouselH = Math.max(80, barsTop - margin + 8 - carouselTop);
    root.setProperty('--m-carousel-h', px(carouselH));
    root.setProperty('--m-bars-h', px(window.innerHeight - barsTop));
    sizeItems(carouselH, width - 2 * margin);
  }

  function ratioOf(image) {
    const [w, h] = String(image.ratio || '4/5').split('/').map(Number);
    return w > 0 && h > 0 ? w / h : 4 / 5;
  }

  function sizeItems(height, room) {
    let changed = false;
    [...track.children].forEach(cell => {
      const width = `${Math.floor(Math.min(height * cell.ratio, room))}px`;
      if (cell.style.width === width) return;
      cell.style.width = width;
      changed = true;
    });
    if (changed) realign();
  }

  function labelLines() {
    let lines = 2;
    [[projectLabel, 'name'], [clientLabel, 'client']].forEach(([{ p }, key]) => {
      const probe = p.cloneNode(true);
      probe.style.visibility = 'hidden';
      p.after(probe);
      const text = probe.querySelector('.m-text');
      PROJECTS.forEach(project => {
        text.textContent = project[key] || '';
        lines = Math.max(lines, Math.round(text.offsetHeight / line));
      });
      probe.remove();
    });
    return lines;
  }

  function toTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  }

  function sync() {
    const open = isMenu();
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    if (view() !== 'about' || open) toTop();
    layout();
  }

  function setMenu(open) {
    if (open === isMenu()) return;
    body.classList.toggle('is-menu', open);

    if (view() === 'home' && JU.morphHalo) JU.morphHalo(open ? 1 : 0);
    if (!open) closeAll();
    sync();
  }

  function closeAll() {
    if (JU.infoOpen && JU.infoOpen() && JU.closeInfo) JU.closeInfo();
  }

  menuButton.addEventListener('click', () => setMenu(!isMenu()));

  document.querySelectorAll('#projects-toggle, #about-toggle').forEach(toggle => {
    const name = toggle.id === 'projects-toggle' ? 'projects' : 'about';
    const pick = event => {
      if (!html.classList.contains('is-phone')) return;

      if (!isMenu()) {
        if (view() !== name) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      body.classList.remove('is-menu');
      if (view() === name) sync();
      else JU.setView(name);
    };
    toggle.addEventListener('click', pick, true);
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') pick(event);
    }, true);
  });

  homeLink.addEventListener('click', () => setMenu(false));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isMenu()) setMenu(false);
  });

  const PROJECTS = (Array.isArray(window.PROJECTS) ? window.PROJECTS : [])
    .filter(project => project.images && project.images.length);
  const items = [];
  PROJECTS.forEach(project =>
    project.images.forEach(image => items.push({ project, image })));

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const hasInfo = project => Boolean(project.client || project.year || project.description ||
    (project.services && project.services.length) || (project.credits && project.credits.length));

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function label(className, sub) {
    const p = element('p', `m-label ${className}`);
    const num = element('span', 'num', '01');
    num.appendChild(element('span', 'num-sub', sub));
    const text = element('span', 'm-text text-inner');
    p.append(num, text);
    return { p, text };
  }

  const carousel = element('section', 'm-carousel');
  carousel.setAttribute('aria-label', 'Projects');
  const labels = element('div', 'm-labels');
  const projectLabel = label('m-project', '.1');
  const clientLabel = label('m-client', '.2');
  const infoLine = element('p', 'm-info');
  const info = element('button', 'project-info');
  info.type = 'button';
  info.setAttribute('aria-haspopup', 'dialog');
  const infoNum = element('span', 'num', '01');
  infoNum.appendChild(element('span', 'num-sub', '.3'));
  info.append(infoNum, element('span', null, 'Info'));
  infoLine.appendChild(info);
  labels.append(infoLine, projectLabel.p, clientLabel.p);
  const track = element('div', 'm-track');
  carousel.append(track, labels);
  document.querySelector('.footer').before(carousel);

  const barBg = element('div', 'm-bar-bg');
  document.querySelector('.footer').before(barBg);

  const BAND_PAD = 20;
  const drawing = document.getElementById('canvas');
  const bandCopy = element('canvas', 'm-bar-drawing');
  barBg.appendChild(bandCopy);
  function copyDrawing() {
    requestAnimationFrame(copyDrawing);
    if (!drawing || !html.classList.contains('is-phone')) return;
    const h = barBg.clientHeight;
    if (!h || !drawing.clientHeight) return;
    const scale = drawing.height / drawing.clientHeight;
    const width = Math.round(drawing.width);
    const height = Math.round((h + BAND_PAD) * scale);
    if (bandCopy.width !== width) bandCopy.width = width;
    if (bandCopy.height !== height) bandCopy.height = height;
    bandCopy.style.height = `${h + BAND_PAD}px`;
    bandCopy.style.top = `${-BAND_PAD}px`;
    bandCopy.style.filter = drawing.style.filter;
    bandCopy.style.opacity = drawing.style.opacity;
    const ctx = bandCopy.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(drawing, 0, drawing.height - height, width, height, 0, 0, width, height);
  }
  requestAnimationFrame(copyDrawing);

  const COPIES = items.length > 1 ? 3 : 1;
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const media = [];

  const near = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      near.unobserve(entry.target);
    }), { root: track, rootMargin: '0px 300% 0px 300%' })
    : null;

  function load(node) {
    node.addEventListener(node.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', realign, { once: true });
    if (node.tagName === 'IMG') {
      const done = () => {
        if (node.src === BLANK) return;
        node.classList.add('is-loaded');
        node.removeEventListener('load', done);
      };
      node.addEventListener('load', done);
    }
    if (node.dataset.poster) node.poster = node.dataset.poster;
    if (node.dataset.src) node.src = node.dataset.src;
    delete node.dataset.src;
    delete node.dataset.poster;
  }

  for (let copy = 0; copy < COPIES; copy++) {
    items.forEach(({ project, image }) => {
      const item = element('div', 'm-item');
      item.ratio = ratioOf(image);
      if (copy !== 1) item.setAttribute('aria-hidden', 'true');
      let node;
      if (image.video) {
        node = element('video');
        node.dataset.src = image.video;
        if (image.poster) node.dataset.poster = image.poster;
        node.muted = true;
        node.defaultMuted = true;
        node.setAttribute('muted', '');
        node.loop = true;
        node.playsInline = true;
        node.setAttribute('playsinline', '');
        node.setAttribute('webkit-playsinline', '');
        node.preload = 'none';
        node.addEventListener('click', () => {
          if (node.paused && node === centered()) node.play().catch(() => {});
        });
        node.setAttribute('aria-label', image.alt || project.name || '');
      } else if (image.src) {
        node = element('img');
        node.src = BLANK;
        node.dataset.src = image.src;
        node.alt = image.alt || project.name || '';
        node.decoding = 'async';
      } else {
        node = element('div', 'project-placeholder');
        node.setAttribute('role', 'img');
        node.setAttribute('aria-label', `${project.name || 'Project'} (placeholder)`);
      }
      if (image.ratio) node.style.aspectRatio = image.ratio;
      item.appendChild(node);
      track.appendChild(item);
      media.push(node);
      if (node.dataset.src) {
        if (near) near.observe(node);
        else load(node);
      }
    });
  }

  let shown = -1;
  const cells = () => track.children;

  function nearest() {
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let gap = Infinity;
    const all = cells();
    for (let i = 0; i < all.length; i++) {
      const d = Math.abs(all[i].offsetLeft + all[i].offsetWidth / 2 - middle);
      if (d < gap) {
        gap = d;
        best = i;
      }
    }
    return best;
  }

  const current = () => (items.length ? nearest() % items.length : 0);

  function setLabels() {
    if (!items.length) return;
    const k = current();
    if (k === shown) return;
    shown = k;
    const { project } = items[k];
    projectLabel.text.textContent = project.name || '';
    clientLabel.text.textContent = project.client || '';
    if (hasInfo(project)) info.removeAttribute('data-empty');
    else info.setAttribute('data-empty', '');
    info.onclick = () => JU.openInfo && JU.openInfo(project, info);
  }

  let aligning = false;
  function showItem(k) {
    const cell = cells()[COPIES > 1 ? items.length + k : k];
    if (!cell) return;
    aligning = true;
    track.scrollLeft = cell.offsetLeft + cell.offsetWidth / 2 - track.clientWidth / 2;
    setTimeout(() => { aligning = false; }, 0);
  }

  let moving = false;
  function realign() {
    if (!moving && shown >= 0) showItem(shown);
  }

  let idleTimer = null;
  function wrapRow() {
    if (COPIES < 3) return;
    const i = nearest();
    if (i < items.length || i >= 2 * items.length) showItem(i % items.length);
  }

  track.addEventListener('scroll', () => {
    if (!aligning) {
      moving = true;
      setLabels();
    }
    playVideos();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      moving = false;
      wrapRow();
      playVideos();
    }, 150);
  }, { passive: true });

  const projectsOpen = () => html.classList.contains('is-phone') &&
    body.classList.contains('is-projects') && !isMenu();
  const centered = () => {
    const cell = cells()[nearest()];
    return cell && cell.firstChild;
  };
  function playVideos() {
    const middle = centered();
    media.forEach(node => {
      if (node.tagName !== 'VIDEO' || !node.getAttribute('src')) return;
      const play = projectsOpen() && !document.hidden && node === middle;
      if (play && node.paused) node.play().catch(() => {});
      if (!play && (!node.paused || node.currentTime)) {
        node.pause();
        node.currentTime = 0;
      }
    });
  }
  media.forEach(node => { if (node.tagName === 'VIDEO') node.addEventListener('loadstart', playVideos); });
  document.addEventListener('visibilitychange', playVideos);

  const unlocked = new WeakSet();
  function unlockVideos() {
    if (!html.classList.contains('is-phone')) return;
    const middle = projectsOpen() && !document.hidden ? centered() : null;
    media.forEach(node => {
      if (node.tagName !== 'VIDEO' || !node.getAttribute('src') || unlocked.has(node)) return;
      unlocked.add(node);
      if (node === middle || !node.paused) return;
      const playing = node.play();
      node.pause();
      if (playing) playing.catch(() => {});
    });
    playVideos();
  }
  ['touchend', 'pointerup'].forEach(type =>
    document.addEventListener(type, unlockVideos, { passive: true }));

  const desktopMedia = JU.carouselMedia;
  JU.carouselMedia = () => (html.classList.contains('is-phone')
    ? (projectsOpen() ? media : [])
    : (desktopMedia ? desktopMedia() : []));

  const hint = document.querySelector('.footer .hint');
  const hintText = hint ? hint.textContent : '';

  function measureContact() {
    const mail = contact.querySelector('.contact-links a');
    const numCol = parseFloat(getComputedStyle(contact.querySelector('.num')).width) || 14;
    const gap = parseFloat(getComputedStyle(html).getPropertyValue('--gap')) || 24;
    if (mail) root.setProperty('--t-col4', px(Math.ceil(numCol + gap + mail.getBoundingClientRect().width + 1)));
  }

  function setPhone() {
    measureContact();
    const on = phone.matches;
    html.classList.toggle('is-phone', on);

    if (hint) hint.textContent = on || window.matchMedia('(pointer: coarse)').matches ? 'Touch to draw' : hintText;
    if (!on && isMenu()) {
      body.classList.remove('is-menu');
      if (view() === 'home' && JU.morphHalo) JU.morphHalo(0);
    }
    sync();
  }

  if (phone.addEventListener) phone.addEventListener('change', setPhone);
  else phone.addListener(setPhone);

  let stillTimer = null;
  function settle() {
    html.classList.add('m-still');
    measureContact();
    layout();
    if (shown >= 0) showItem(shown);
    void body.offsetHeight;
    clearTimeout(stillTimer);
    stillTimer = setTimeout(() => html.classList.remove('m-still'), 50);
  }

  window.addEventListener('resize', settle);
  window.addEventListener('load', settle);

  new MutationObserver(() => {
    sync();
    playVideos();
  }).observe(body, { attributes: true, attributeFilter: ['class'] });

  setPhone();
  showItem(0);
  setLabels();

  let fontsIn = Promise.resolve();
  if (document.fonts && document.fonts.load) {
    fontsIn = Promise.all(['bold 12px "JU Symbols"', '12px "JU Symbols"', 'bold 12px "JU Punct"',
      '12px "JU Times"', 'bold 12px Helvetica'].map(font => document.fonts.load(font, '©2026 [Aa] 01.1'))
      .map(loading => loading.catch(() => {})));
    document.fonts.addEventListener('loadingdone', settle);
  }
  Promise.race([fontsIn, new Promise(done => setTimeout(done, 1000))]).then(() => {
    settle();

    setTimeout(() => html.classList.remove('m-loading', 'is-reloading'), 120);
  });
})();
