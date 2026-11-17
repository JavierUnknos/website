/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const body = document.body;

  const PROJECTS = (Array.isArray(window.PROJECTS) ? window.PROJECTS : [])
    .filter(project => project.images && project.images.length);
  const items = [];
  PROJECTS.forEach(project =>
    project.images.forEach(image => items.push({ project, image })));
  if (!items.length) return;
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const JU = window.JU || {};
  const hasInfo = project => Boolean(project.client || project.year || project.description ||
    (project.services && project.services.length) || (project.credits && project.credits.length));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const unit = () => parseFloat(getComputedStyle(document.querySelector('.bio h1')).marginTop) / 10 || 1;
  const wrap = k => ((k % items.length) + items.length) % items.length;

  const THUMB = 0.2;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function ratioOf(image) {
    const [w, h] = String(image.ratio || '4/5').split('/').map(Number);
    return w && h ? w / h : 0.8;
  }

  const carousel = element('section', 'carousel');

  carousel.id = 'projects-panel';
  carousel.setAttribute('aria-label', 'Projects');
  carousel.setAttribute('aria-hidden', 'true');
  const track = element('div', 'carousel-track');
  const labels = element('div', 'carousel-labels');

  const projectLabel = element('p', 'carousel-label carousel-project');
  const projectNum = element('span', 'num', '01');
  projectNum.appendChild(element('span', 'num-sub', '.1'));
  const projectName = element('span', 'text-inner');
  const projectText = element('span', 'carousel-text');
  projectText.append(projectName);
  projectLabel.append(projectNum, projectText);

  const clientLabel = element('p', 'carousel-label carousel-client');
  const clientNum = element('span', 'num', '01');
  clientNum.appendChild(element('span', 'num-sub', '.2'));
  const clientName = element('span', 'text-inner');
  const clientText = element('span', 'carousel-text');
  clientText.append(clientName);
  clientLabel.append(clientNum, clientText);

  const info = element('button', 'project-info');
  info.type = 'button';
  info.setAttribute('aria-haspopup', 'dialog');
  const infoNum = element('span', 'num', '01');
  infoNum.appendChild(element('span', 'num-sub', '.3'));
  info.append(infoNum, element('span', null, 'Info'));
  const infoLabel = element('p', 'carousel-label carousel-info');
  infoLabel.appendChild(info);

  labels.append(projectLabel, clientLabel, infoLabel);

  const hit = element('div', 'carousel-hit');
  carousel.append(hit, track, labels);
  document.querySelector('.footer').before(carousel);

  function makeMedia(item) {
    const { project, image } = item;
    let media;
    if (image.video) {
      media = element('video');
      media.src = image.video;
      if (image.poster) media.poster = image.poster;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = 'metadata';

      media.addEventListener('playing', () => {
        if (media.inMiddle) return;

        media.pause();
        media.load();
      });
      media.setAttribute('aria-label', image.alt || project.name || '');
    } else if (image.src) {
      media = element('img');
      media.src = image.src;
      media.alt = image.alt || project.name || '';
      media.decoding = 'async';
      // already cached: show sharp at once; otherwise focus in when it arrives
      if (media.complete && media.naturalWidth) media.classList.add('is-loaded');
      else media.addEventListener('load', () => media.classList.add('is-loaded'), { once: true });
    } else {
      media = element('div', 'project-placeholder');
      media.setAttribute('role', 'img');
      media.setAttribute('aria-label', `${project.name || 'Project'} (placeholder)`);
    }
    return media;
  }

  let bandHeight = 0;
  let thumb = 0;

  function layout() {
    const u = unit();
    const height = window.innerHeight;
    const line = parseFloat(getComputedStyle(projectLabel).lineHeight) || 15 * u;
    const bioBottom = document.querySelector('.bio h1').getBoundingClientRect().bottom;
    const barsTop = Math.min(...[document.querySelector('.toolbar'), document.querySelector('.footer')]
      .map(bar => bar.getBoundingClientRect().top));
    const menuHeight = window.matchMedia('(max-width: 700px)').matches ? 2 * line : line;
    const labelsHeight = line;
    const space = 2 * line;

    let rowTop = Math.round(height * 0.296);
    let labelsTop = rowTop - 10 * u - labelsHeight;
    let menuTop = bioBottom + (labelsTop - bioBottom - menuHeight) / 2;
    if (menuTop < bioBottom + space) {
      menuTop = bioBottom + space;
      labelsTop = menuTop + menuHeight + space;
      rowTop = labelsTop + labelsHeight + 10 * u;
    }
    bandHeight = Math.max(80 * u, barsTop - rowTop);
    thumb = Math.round(bandHeight * THUMB);
    document.documentElement.style.setProperty('--carousel-menu-top', `${menuTop}px`);
    carousel.style.setProperty('--carousel-labels-bottom', `${height - labelsTop - labelsHeight}px`);
    carousel.style.setProperty('--carousel-top', `${rowTop}px`);
    carousel.style.setProperty('--carousel-height', `${bandHeight}px`);
  }

  function bigWidth(k) {
    const ratio = ratioOf(items[wrap(k)].image);
    return Math.min(bandHeight * ratio, window.innerWidth - 2 * thumb);
  }

  let from = 0;
  let current = 0;
  let grow = 1;
  let slide = 1;

  const weightOf = k => (k === current ? grow : 0) + (k === from && from !== current ? 1 - grow : 0);
  const widthAt = k => thumb + (bigWidth(k) - thumb) * weightOf(k);

  const live = new Map();

  function draw() {
    const vw = window.innerWidth;

    const offsetOf = k => {
      let sum = 0;
      if (k >= from) for (let i = from; i < k; i++) sum += widthAt(i);
      else for (let i = k; i < from; i++) sum -= widthAt(i);
      return sum;
    };

    const startLeft = vw / 2 - bigWidth(from) / 2;
    const anchored = current >= from ? startLeft : startLeft + bigWidth(from) - widthAt(from);
    const grownAnchored = current >= from ? startLeft : startLeft + bigWidth(from) - thumb;

    const finalOffset = current >= from
      ? thumb * (current - from)
      : -(bigWidth(current) + thumb * (from - current - 1));
    const centred = vw / 2 - bigWidth(current) / 2 - finalOffset;
    const leftFrom = anchored + (centred - grownAnchored) * slide;
    const placed = new Map();
    let x = leftFrom;
    for (let k = from; x < vw && k - from <= items.length; k++) {
      const w = widthAt(k);
      if (x + w > 0) placed.set(k, { left: x, width: w });
      x += w;
    }
    x = leftFrom;
    for (let k = from - 1; x > 0 && from - k <= items.length; k--) {
      const w = widthAt(k);
      x -= w;
      if (x < vw) placed.set(k, { left: x, width: w });
    }

    live.forEach((node, k) => {
      if (placed.has(k)) return;
      node.remove();
      live.delete(k);
    });
    placed.forEach(({ left, width }, k) => {
      let node = live.get(k);
      if (!node) {
        node = element('div', 'carousel-item');
        node.appendChild(mediaFor(wrap(k)));
        track.appendChild(node);
        live.set(k, node);
      }
      const ratio = ratioOf(items[wrap(k)].image);
      // Bordes ajustados a píxeles reales de pantalla: dos imágenes vecinas comparten
      // exactamente el mismo borde y no queda una línea clara entre ellas al moverse.
      const dpr = window.devicePixelRatio || 1;
      const x0 = Math.round(left * dpr) / dpr;
      const x1 = Math.round((left + width) * dpr) / dpr;
      node.style.width = `${x1 - x0}px`;
      node.style.height = `${Math.min(bandHeight, width / ratio).toFixed(1)}px`;
      node.style.transform = `translateX(${x0}px)`;

      const video = node.firstChild;
      if (video.tagName === 'VIDEO') {
        const play = open() && !document.hidden && k === current;
        video.inMiddle = play;
        if (play && video.paused) video.play().catch(() => {});
        if (!play && (!video.paused || video.currentTime)) {
          video.pause();
          video.load();
        }
      }
    });
    setProject(items[wrap(current)].project);
    preload();
  }

  const PRELOAD = 8;
  const made = new Map();
  function mediaFor(i) {
    let media = made.get(i);

    if (media && media.isConnected) return makeMedia(items[i]);
    if (!media) {
      media = makeMedia(items[i]);
      made.set(i, media);
    }
    return media;
  }
  function preload() {
    for (let d = 1; d <= PRELOAD; d++) {
      [current + d, current - d].forEach(k => {
        const i = wrap(k);
        if (made.has(i)) return;
        const media = makeMedia(items[i]);
        made.set(i, media);

        if (media.tagName === 'VIDEO' && media.poster) new Image().src = media.poster;
      });
    }
  }

  let shown = null;

  function setProject(project) {
    if (project === shown) return;
    shown = project;
    projectName.textContent = project.name || '';
    clientName.textContent = project.client || '';
    info.hidden = !hasInfo(project);
    info.onclick = () => JU.openInfo && JU.openInfo(project, info);
  }

  let glide = null;
  let frame = 0;

  const TIME = 600;
  const GROW_END = 1;
  const SLIDE_START = 0;
  function bezier(x1, y1, x2, y2) {
    const at = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
    return x => {
      let low = 0;
      let high = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        if (at(x1, x2, mid) < x) low = mid;
        else high = mid;
      }
      return at(y1, y2, (low + high) / 2);
    };
  }
  const ease = bezier(0.77, 0, 0.175, 1);
  const part = (t, a, b) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));

  const open = () => body.classList.contains('is-projects') &&
    !document.documentElement.classList.contains('is-phone');

  let queued = 0;

  function tick(now) {
    frame = 0;
    if (!glide) return;
    const t = Math.min(1, (now - glide.start) / TIME);
    grow = part(t, 0, GROW_END);
    slide = part(t, SLIDE_START, 1);
    draw();
    if (t < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    glide = null;
    from = current;
    grow = 1;
    slide = 1;
    draw();
    if (queued) {
      const step = Math.sign(queued);
      queued -= step;
      go(step);
    }
  }

  function go(step) {
    if (JU.infoOpen && JU.infoOpen()) return;

    live.forEach(node => node.classList.remove('is-hover'));
    hit.classList.remove('is-thumb');
    if (glide) {
      queued = Math.max(-1, Math.min(1, queued + step));
      return;
    }
    from = current;
    current += step;

    if (reducedMotion.matches || document.hidden) {
      from = current;
      grow = 1;
      slide = 1;
      draw();
      return;
    }
    grow = 0;
    slide = 0;
    glide = { start: performance.now() };
    if (!frame) frame = requestAnimationFrame(tick);
  }

  const onLeft = event => event.clientX < window.innerWidth / 2;

  function thumbAt(x, y) {
    let found = null;
    live.forEach((node, k) => {
      if (k === current) return;
      const r = node.getBoundingClientRect();
      if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) found = k;
    });
    return found;
  }

  function hover(event) {
    const k = event && !glide ? thumbAt(event.clientX, event.clientY) : null;
    live.forEach((node, key) => node.classList.toggle('is-hover', key === k));

    hit.classList.toggle('is-thumb', k !== null);

    setProject(items[wrap(k !== null ? k : current)].project);
  }

  const noHover = window.matchMedia('(hover: none)');
  hit.addEventListener('mousemove', event => {
    if (noHover.matches) return;
    hit.classList.toggle('is-back', onLeft(event));
    hover(event);
  });
  hit.addEventListener('mouseleave', () => hover(null));
  let swiped = false;

  hit.addEventListener('click', event => {
    if (swiped) return;
    const k = glide ? null : thumbAt(event.clientX, event.clientY);
    if (k !== null) go(k - current);
    else go(onLeft(event) ? -1 : 1);
  });

  document.addEventListener('keydown', event => {
    if (!open() || (JU.infoOpen && JU.infoOpen())) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();

    const active = document.activeElement;
    if (active && active !== document.body && active.blur) active.blur();
    go(step);
  });

  let wheelSum = 0;
  let wheelLocked = false;
  let wheelTimer = null;
  window.addEventListener('wheel', event => {
    if (!open() || (JU.infoOpen && JU.infoOpen())) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelLocked = false; wheelSum = 0; }, 180);
    if (wheelLocked) return;
    wheelSum += delta;
    if (Math.abs(wheelSum) >= 40) {
      go(wheelSum > 0 ? 1 : -1);
      wheelLocked = true;
      wheelSum = 0;
    }
  }, { passive: true });

  let touch = null;
  hit.addEventListener('touchstart', event => {
    swiped = false;
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  hit.addEventListener('touchend', event => {
    if (!touch) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      go(dx < 0 ? 1 : -1);
      setTimeout(() => { swiped = false; }, 400);
    }
  }, { passive: true });

  let wasOpen = false;

  function relayout() {
    if (!open()) return;
    layout();
    glide = null;
    from = current;
    grow = 1;
    slide = 1;
    draw();
  }

  function sync() {
    const now = open();
    if (now === wasOpen) return;
    wasOpen = now;
    carousel.setAttribute('aria-hidden', String(!now));
    if (now) relayout();
    else live.forEach(node => { if (node.firstChild.tagName === 'VIDEO') node.firstChild.pause(); });
  }

  new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  document.addEventListener('visibilitychange', () => { if (open()) draw(); });

  JU.carouselMedia = () => (open() ? [...live.values()].map(node => node.firstChild) : []);
  window.JU = JU;

  sync();
})();
