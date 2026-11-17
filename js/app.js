/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const RED = '#FF4438';
  const PAPER = '#fcfcfc';
  const STROKE_WIDTH = 2;
  const GLOW = 5;

  const HALO_WIDTH = 6;
  const HALO_BLUR = 4;
  const HALO_OPACITY = 0.25;

  const isHalo = () => document.body.classList.contains('is-section-open');

  const canvas = document.getElementById('canvas');
  const undoButton = document.getElementById('undo');
  const cleanButton = document.getElementById('clean');
  const jpgButton = document.getElementById('download-jpg');
  const pdfButton = document.getElementById('download-pdf');

  paper.setup(canvas);
  const tool = new paper.Tool();
  tool.minDistance = 2;

  const paths = [];
  let path = null;

  function updateControls() {
    undoButton.disabled = paths.length === 0;
  }

  function strokeHalo(ctx, width, scale) {
    const offset = width + HALO_WIDTH * 10;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = HALO_WIDTH;
    ctx.strokeStyle = RED;
    ctx.shadowColor = `rgba(255, 68, 56, ${HALO_OPACITY})`;
    ctx.shadowBlur = HALO_BLUR * 2 * scale;
    ctx.shadowOffsetX = offset * scale;
    ctx.translate(-offset, 0);
    paths.forEach(item => {
      if (item.segments.length > 1) ctx.stroke(new Path2D(item.pathData));
    });
    ctx.restore();
  }

  const MORPH_TIME = 700;
  let haloT = 0;
  let morphFrame = 0;

  function strokeWidthAt(t) {
    return STROKE_WIDTH + (HALO_WIDTH - STROKE_WIDTH) * t;
  }

  function applyHalo(t) {
    haloT = t;
    const width = strokeWidthAt(t);
    const ink = STROKE_WIDTH + (HALO_WIDTH * HALO_OPACITY - STROKE_WIDTH) * t;
    paths.forEach(item => { item.strokeWidth = width; });
    canvas.style.opacity = t ? String(ink / width) : '';
    canvas.style.filter = t ? `blur(${(HALO_BLUR * t).toFixed(2)}px)` : '';
    paper.view.update();
  }

  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function morphHalo(target) {
    cancelAnimationFrame(morphFrame);
    if (reducedMotion.matches) {
      applyHalo(target);
      return;
    }
    const from = haloT;
    const duration = MORPH_TIME * Math.abs(target - from);
    const start = performance.now();
    const step = now => {
      const k = duration ? Math.min(1, (now - start) / duration) : 1;
      applyHalo(from + (target - from) * ease(k));
      if (k < 1) morphFrame = requestAnimationFrame(step);
    };
    morphFrame = requestAnimationFrame(step);
  }

  tool.onMouseDown = event => {
    path = new paper.Path({
      strokeColor: RED,
      strokeWidth: STROKE_WIDTH,
      strokeCap: 'round',
      strokeJoin: 'round',
      shadowColor: new paper.Color(RED),
      shadowBlur: GLOW,
      shadowOffset: new paper.Point(0, 0)
    });
    path.strokeWidth = strokeWidthAt(haloT);
    path.add(event.point);
    paths.push(path);
    updateControls();
  };

  tool.onMouseDrag = event => {
    if (path) path.add(event.point);
  };

  tool.onMouseUp = () => {
    path = null;
  };

  function undo() {
    const last = paths.pop();
    if (last) last.remove();
    paper.view.update();
    updateControls();
  }

  function clean() {
    paths.splice(0).forEach(item => item.remove());
    paper.view.update();
    updateControls();
  }

  undoButton.addEventListener('click', undo);
  cleanButton.addEventListener('click', clean);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undo();
    }
  });

  const EXPORT_TEXT = 'body > .bio, .menu, .m-menu, .about-panel, .footer, .clock';

  function filename(extension) {
    const now = new Date();
    const two = n => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
    const time = `${two(now.getHours())}-${two(now.getMinutes())}`;
    return `JAVIER-UNKNOS_${date}_${time}.${extension}`;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function download(blob, name) {
    if (isIOS && navigator.canShare && typeof File === 'function') {
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(error => {
          if (error.name !== 'AbortError') downloadLink(blob, name);
        });
        return;
      }
    }
    downloadLink(blob, name);
  }

  function downloadLink(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function isTransparent(element) {
    for (let el = element; el && el !== document.body; el = el.parentElement) {
      if (parseFloat(getComputedStyle(el).opacity) === 0) return true;
    }
    return false;
  }

  function collectWords(selector = EXPORT_TEXT) {
    const measure = document.createElement('canvas').getContext('2d');
    const words = [];
    document.querySelectorAll(selector).forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement.closest('.hint')) continue;
        if (view === 'home' && node.parentElement.closest('.m-menu')) continue;
        const style = getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (isTransparent(node.parentElement)) continue;
        const size = parseFloat(style.fontSize);
        const weight = parseInt(style.fontWeight, 10) >= 600 ? 'bold' : 'normal';
        const font = `${weight} ${size}px ${style.fontFamily}`;
        measure.font = font;
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(node.nodeValue))) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rect = range.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          let text = match[0];
          if (style.textTransform === 'uppercase') text = text.toUpperCase();

          if (style.textTransform === 'capitalize') text = text.charAt(0).toUpperCase() + text.slice(1);
          const metrics = measure.measureText(text);
          const ascent = metrics.fontBoundingBoxAscent ?? size * 0.77;
          const descent = metrics.fontBoundingBoxDescent ?? size * 0.23;
          const baseline = rect.top + (rect.height - ascent - descent) / 2 + ascent;
          words.push({ text, x: rect.left, baseline, width: rect.width, size, weight, font, color: style.color });
        }
      }
    });
    return words;
  }

  function drawWords(ctx, words) {
    words.forEach(word => {
      ctx.font = word.font;

      ctx.fillStyle = word.color;
      ctx.fillText(word.text, word.x, word.baseline);
    });
  }

  function shownMedia() {
    return window.JU && window.JU.carouselMedia ? window.JU.carouselMedia() : [];
  }

  async function loadPosters() {
    const posters = new Map();
    await Promise.all(shownMedia().map(node => {
      if (node.tagName !== 'VIDEO' || node.readyState >= 2 || !node.poster) return null;
      const r = node.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return null;
      const still = new Image();
      still.src = node.poster;
      const loaded = still.decode().then(() => posters.set(node, still)).catch(() => {});

      return Promise.race([loaded, new Promise(done => setTimeout(done, 500))]);
    }));
    return posters;
  }

  function drawProjects(ctx, width, height, posters, noMedia) {
    ctx.save();
    shownMedia().forEach(node => {
      const r = node.getBoundingClientRect();
      if (r.bottom < 0 || r.top > height || !r.width) return;
      try {
        if (noMedia) throw new Error('no media');
        if (node.tagName === 'IMG' && !node.dataset.src && node.complete && node.naturalWidth) {
          ctx.drawImage(node, r.left, r.top, r.width, r.height);
          return;
        }
        if (node.tagName === 'VIDEO' && node.readyState >= 2) {
          ctx.drawImage(node, r.left, r.top, r.width, r.height);
          return;
        }
        if (posters.has(node)) {
          ctx.drawImage(posters.get(node), r.left, r.top, r.width, r.height);
          return;
        }
      } catch (error) {}

      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(r.left, r.top, r.width, r.height);
    });
    drawWords(ctx, collectWords('.carousel-labels'));
    ctx.restore();
  }

  function drawInfoSheet(ctx, output, width, height, scale) {
    const copy = document.createElement('canvas');
    copy.width = output.width;
    copy.height = output.height;
    copy.getContext('2d').drawImage(output, 0, 0);
    const sheetStyle = getComputedStyle(infoSheet);
    const blur = parseFloat((sheetStyle.backdropFilter || sheetStyle.webkitBackdropFilter || '').match(/[\d.]+/)) || 6;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${blur * scale}px)`;
    ctx.drawImage(copy, 0, 0);
    ctx.restore();
    ctx.fillStyle = sheetStyle.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const card = document.querySelector('.info-card');
    const r = card.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(r.left, r.top, r.width, r.height, radius);
    else ctx.rect(r.left, r.top, r.width, r.height);
    ctx.fillStyle = getComputedStyle(card).backgroundColor;
    ctx.fill();
    ctx.clip();
    drawWords(ctx, collectWords('.info-card'));
    ctx.restore();
  }

  jpgButton.addEventListener('click', async () => {
    const posters = document.body.classList.contains('is-projects') ? await loadPosters() : new Map();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.max(2, window.devicePixelRatio || 1);

    const render = noMedia => {
      const output = document.createElement('canvas');
      output.width = Math.round(width * scale);
      output.height = Math.round(height * scale);
      const ctx = output.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, width, height);

      if (isHalo()) {
        strokeHalo(ctx, width, scale);
      } else {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = RED;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.shadowColor = RED;
        ctx.shadowBlur = GLOW * scale;
        paths.forEach(item => {
          if (item.segments.length > 1) ctx.stroke(new Path2D(item.pathData));
        });
        ctx.restore();
      }

      ctx.textBaseline = 'alphabetic';
      if (document.body.classList.contains('is-projects')) drawProjects(ctx, width, height, posters, noMedia);
      drawWords(ctx, collectWords());
      if (infoOpen()) drawInfoSheet(ctx, output, width, height, scale);
      return output;
    };

    const save = output => output.toBlob(blob => {
      if (blob) download(blob, filename('jpg'));
    }, 'image/jpeg', 0.92);
    try {
      save(render(false));
    } catch (error) {
      save(render(true));
    }
  });

  function buildSvg(width, height) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('fill', 'none');
    group.setAttribute('stroke', RED);
    group.setAttribute('stroke-width', STROKE_WIDTH);
    group.setAttribute('stroke-linecap', 'round');
    group.setAttribute('stroke-linejoin', 'round');
    paths.forEach(item => {
      if (item.segments.length < 2) return;
      const element = document.createElementNS(ns, 'path');
      element.setAttribute('d', item.pathData);
      group.appendChild(element);
    });
    svg.appendChild(group);
    return svg;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  let pdfLibraries = null;
  const loadPdfLibraries = () => {
    if (!pdfLibraries) {
      pdfLibraries = loadScript('vendor/jspdf.umd.min.js')
        .then(() => loadScript('vendor/svg2pdf.umd.min.js'))
        .catch(error => { pdfLibraries = null; throw error; });
    }
    return pdfLibraries;
  };

  pdfButton.addEventListener('click', async () => {
    pdfButton.disabled = true;
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      await loadPdfLibraries();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: width >= height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [width, height],
        compress: true
      });
      pdf.setProperties({ title: 'Javier Unknos', author: 'Javier Unknos', creator: 'javierunknos.com' });
      await pdf.svg(buildSvg(width, height), { x: 0, y: 0, width, height });
      pdf.save(filename('pdf'));
    } catch (error) {
      console.error(error);
    } finally {
      pdfButton.disabled = false;
    }
  });

  (() => {
    const link = document.querySelector('.footer a');
    const updated = new Date(document.lastModified);
    if (!link || Number.isNaN(updated.getTime()) || Math.abs(Date.now() - updated) < 5000) return;
    const two = n => String(n).padStart(2, '0');
    link.textContent = `${two(updated.getDate())}/${two(updated.getMonth() + 1)}/${two(updated.getFullYear() % 100)}`;
    const month = updated.toLocaleString('en-US', { month: 'long' });
    link.href = `https://en.wikipedia.org/wiki/${month}_${updated.getDate()}`;
  })();

  const clock = document.getElementById('clock');
  const clockHm = document.getElementById('clock-hm');
  const clockS = document.getElementById('clock-s');
  const clockZone = document.getElementById('clock-zone');
  const footer = document.querySelector('.footer p');
  const FALLBACK_ZONE = 'Europe/Madrid';

  let timeZone = FALLBACK_ZONE;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_ZONE;
  } catch (error) {}

  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const zoneFormat = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' });

  function tick() {
    const now = new Date();
    const time = timeFormat.format(now);
    clockHm.textContent = time.slice(0, 5);
    clockS.textContent = time.slice(5);
    clock.dateTime = now.toISOString();
    const zone = zoneFormat.formatToParts(now).find(part => part.type === 'timeZoneName');
    clockZone.textContent = zone ? zone.value.replace('GMT', 'UTC') : 'UTC';
    fitFooter();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  function fitFooter() {
    footer.style.setProperty('--clock-width', `${clock.parentElement.offsetWidth}px`);
  }

  if ('ResizeObserver' in window) new ResizeObserver(fitFooter).observe(clock.parentElement);
  window.addEventListener('resize', fitFooter);

  const aboutToggle = document.getElementById('about-toggle');
  const aboutPanel = document.getElementById('about-panel');
  const projectsToggle = document.getElementById('projects-toggle');
  const menu = document.querySelector('.menu');
  const bio = document.querySelector('.bio');
  const bottomBars = [document.querySelector('.toolbar'), document.querySelector('.footer'), document.querySelector('.legal-bar')];
  const sections = {
    about: { toggle: aboutToggle, panel: aboutPanel, item: aboutToggle.closest('.menu-item') },

    projects: { toggle: projectsToggle, panel: null, item: projectsToggle.closest('.menu-item') }
  };
  const rootStyle = document.body.style;
  const contactMail = document.querySelector('.contact-mail');
  let view = 'home';

  const px = value => `${value}px`;

  let menuTop = 0;

  function layoutSections() {
    if (view === 'home') return;
    const height = window.innerHeight;
    const line = parseFloat(getComputedStyle(aboutToggle).lineHeight);
    const space = 2 * line;

    menuTop = Math.max(height * 0.265, bio.getBoundingClientRect().bottom + window.scrollY + aboutScroll + space);

    const tablet = window.innerWidth > 700 && window.innerWidth <= 1040 &&
      !document.documentElement.classList.contains('is-phone');
    if (tablet && view === 'about') {
      const bioBottom = bio.querySelector('h1, p').getBoundingClientRect().bottom + window.scrollY;
      const unit = parseFloat(getComputedStyle(bio.querySelector('h1, p')).marginTop) / 10 || 1;
      const labelsTop = Math.round(height * 0.296) - 10 * unit - line;
      menuTop = Math.max(bioBottom + space, bioBottom + (labelsTop - bioBottom - line) / 2);
    }
    rootStyle.setProperty('--menu-top', px(menuTop));
    if (view === 'projects') return;

    const unfolding = [...menu.querySelectorAll('.contact-extra')]
      .reduce((sum, row) => sum + row.scrollHeight - row.offsetHeight, 0);
    const menuBlock = menu.offsetHeight + unfolding;
    const barsTop = Math.min(...bottomBars.filter(bar => bar && bar.offsetHeight).map(bar => bar.getBoundingClientRect().top));
    const desktop = window.innerWidth > 1040 && !document.documentElement.classList.contains('is-phone');
    let panelTop = menuTop + menuBlock + space;
    let scrolling = false;

    if (desktop) {
      // About on desktop, as the window gets lower:
      // 1. the lists start at mid-height;
      // 2. if they don't fit, they sit on the bottom bars (`space` above them);
      // 3. when they reach Contact (`space` under its last link) they push the
      //    menu up, both blocks together, until the menu is as high as in Projects;
      // 4. if it still doesn't fit, bio + menu + lists scroll as one block while
      //    the bottom bars and the drawing stay fixed.
      const kids = [...aboutPanel.children].filter(kid => kid.offsetHeight);
      const listsHeight = kids.reduce((max, kid) => Math.max(max, kid.offsetTop + kid.offsetHeight), 0) -
        kids.reduce((min, kid) => Math.min(min, kid.offsetTop), Infinity);
      const bioText = bio.querySelector('h1, p');
      const bioBottom = bioText.getBoundingClientRect().bottom + aboutScroll;
      const unit = parseFloat(getComputedStyle(bioText).marginTop) / 10 || 1;
      const labelsTop = Math.round(height * 0.296) - 10 * unit - line;
      const projectsMenuTop = Math.max(bioBottom + space, bioBottom + (labelsTop - bioBottom - line) / 2);
      const listsTop = Math.min(height / 2, barsTop - space - listsHeight);

      menuTop = Math.max(Math.min(menuTop, projectsMenuTop), Math.min(menuTop, listsTop - space - menuBlock));
      panelTop = Math.max(menuTop + menuBlock + space, listsTop);
      scrolling = panelTop + listsHeight > barsTop - space + 0.5;
      rootStyle.setProperty('--menu-top', px(menuTop));
    }

    setAboutScroll(scrolling);
    rootStyle.setProperty('--about-panel-top', px(scrolling ? 0 : panelTop));
    rootStyle.setProperty('--about-panel-pad-top', px(scrolling ? panelTop : 0));
    rootStyle.setProperty('--about-panel-pad-bottom', px(scrolling ? space : 0));
    rootStyle.setProperty('--about-panel-bottom', px(Math.max(0, height - barsTop)));
  }

  // Desktop About taller than the window: the panel becomes the scroller and
  // carries the bio and the menu with it.
  let aboutScroll = 0;

  function moveWithPanel() {
    aboutScroll = document.body.classList.contains('is-about-scroll') ? aboutPanel.scrollTop : 0;
    rootStyle.setProperty('--about-scroll', px(-aboutScroll));
  }

  function setAboutScroll(on) {
    if (document.body.classList.contains('is-about-scroll') === on) return;
    document.body.classList.toggle('is-about-scroll', on);
    if (!on) aboutPanel.scrollTop = 0;
    moveWithPanel();
  }

  aboutPanel.addEventListener('scroll', moveWithPanel, { passive: true });

  window.addEventListener('wheel', event => {
    if (!document.body.classList.contains('is-about-scroll') || view !== 'about') return;
    if (aboutPanel.contains(event.target)) return;
    aboutPanel.scrollTop += event.deltaMode === 1 ? event.deltaY * 15 : event.deltaY;
  }, { passive: true });

  function keepAtTop() {
    if (view === 'projects' || document.documentElement.classList.contains('is-phone')) return;
    if (window.scrollY) window.scrollTo(0, 0);
  }

  window.addEventListener('scroll', keepAtTop, { passive: true });

  const phone = window.matchMedia('(max-width: 700px)');
  const SWAP_TIME = 150;
  let swapTimer = null;

  function setView(next) {
    clearTimeout(swapTimer);
    if (next === view) return;

    const swap = phone.matches && !document.documentElement.classList.contains('is-phone') &&
      (view === 'about') !== (next === 'about');
    if (swap && !menu.classList.contains('is-swapping')) {
      menu.classList.add('is-swapping');
      swapTimer = setTimeout(() => {
        applyView(next);
        menu.classList.remove('is-swapping');
      }, SWAP_TIME);
      return;
    }
    applyView(next);
    menu.classList.remove('is-swapping');
  }

  const DESCENT_TIME = 700;
  let closingTimer = null;

  function applyView(next) {
    const previous = view;
    if (next === previous) return;
    view = next;
    const open = next !== 'home';
    const body = document.body;
    clearTimeout(closingTimer);
    body.classList.toggle('is-closing', !open);

    Object.entries(sections).forEach(([name, section]) => {
      section.item.classList.toggle('is-current', open ? name === next : name === previous);
      section.toggle.setAttribute('aria-expanded', String(name === next));
      if (section.panel) section.panel.setAttribute('aria-hidden', String(name !== next));
    });
    if (!open) {
      closingTimer = setTimeout(() => {
        body.classList.remove('is-closing');
        Object.values(sections).forEach(section => section.item.classList.remove('is-current'));
      }, DESCENT_TIME + 100);
    }
    body.classList.toggle('is-section-open', open);
    body.classList.toggle('is-about', next === 'about');
    body.classList.toggle('is-projects', next === 'projects');
    contactMail.tabIndex = next === 'projects' ? 0 : -1;
    if (next === 'projects') window.scrollTo(0, 0);
    if (next !== 'about') setAboutScroll(false);
    layoutSections();
    morphHalo(open ? 1 : 0);
    syncAddress();
  }

  const HASHES = { projects: '#projects', about: '#about' };
  let pushedHash = false;

  const viewFromHash = () =>
    Object.keys(HASHES).find(name => HASHES[name] === window.location.hash) || 'home';

  function syncAddress() {
    const shown = viewFromHash();
    if (shown === view) return;
    if (view !== 'home') {
      if (shown === 'home') {
        history.pushState(null, '', HASHES[view]);
        pushedHash = true;
      } else {
        history.replaceState(null, '', HASHES[view]);
      }
    } else if (pushedHash) {
      pushedHash = false;
      history.back();
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  window.addEventListener('popstate', () => {
    const shown = viewFromHash();
    if (shown === view) return;
    pushedHash = shown !== 'home';
    if (view === 'projects') closeInfo();
    setView(shown);
  });

  Object.entries(sections).forEach(([name, section]) => {
    const toggle = () => setView(view === name ? 'home' : name);
    section.toggle.addEventListener('click', toggle);
    section.toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });

  function goHome(event) {
    event.preventDefault();
    if (view !== 'home') setView('home');
  }

  document.getElementById('home-link').addEventListener('click', goHome);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (infoOpen()) closeInfo();
    else if (view !== 'home') setView('home');
  });
  window.addEventListener('resize', layoutSections);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const infoSheet = document.getElementById('info-sheet');
  const infoClose = document.getElementById('info-close');
  const infoField = id => document.getElementById(`info-${id}`);
  let infoOpener = null;

  const infoOpen = () => infoSheet.classList.contains('is-open');

  function setInfoField(id, value) {
    const text = infoField(id);
    const empty = value === undefined || value === null || value === '' ||
      (Array.isArray(value) && !value.length);
    text.textContent = '';
    if (empty) return;
    if (Array.isArray(value)) value.forEach(line => text.appendChild(element('span', null, line)));
    else text.textContent = String(value);
  }

  const PEOPLE = window.PEOPLE || {};

  const instagram = handle => `https://www.instagram.com/${handle.replace(/^@/, '')}/`;

  function addressOf(value) {
    if (!value) return null;
    if (/^@[\w.]+$/.test(value)) return instagram(value);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
    return value;
  }

  function personLink(name) {
    const url = /^@[\w.]+$/.test(name) ? instagram(name) : addressOf(PEOPLE[name]);
    if (!url) return element('span', 'credit-name', name);
    const link = element('a', 'credit-person', name);
    link.href = url;
    if (!url.startsWith('mailto:')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  }

  function appendPeople(parent, names) {
    const list = names.split(/,\s*/);
    list.forEach((name, index) => {
      const person = personLink(name.trim());
      if (index === list.length - 1) {
        parent.appendChild(person);
        return;
      }
      const item = element('span', 'credit-item');
      item.append(person, ',');
      parent.append(item, ' ');
    });
  }

  function creditLine(line) {
    const span = element('span', 'credit');
    const split = line.indexOf(': ');
    const names = split < 0 ? line : line.slice(split + 2);

    if (split >= 0) {
      span.append(element('span', 'credit-role', line.slice(0, split + 1)), ' ');
    }
    appendPeople(span, names);
    return span;
  }

  function awardLine(award) {
    if (!award.url) return element('span', 'award', award.text);
    const link = element('a', 'award credit-person', award.text);
    link.href = award.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function openInfo(project, opener) {
    setInfoField('name', project.name);
    const client = infoField('client');
    client.textContent = '';
    if (project.client) appendPeople(client, project.client);
    setInfoField('year', project.year);
    setInfoField('services', project.services);

    infoField('description').textContent = project.description || '';
    infoField('concept').hidden = !project.description;
    const credits = project.credits || [];
    infoField('credits-block').hidden = !credits.length;
    const creditsText = infoField('credits');
    creditsText.textContent = '';
    credits.forEach(line => creditsText.appendChild(creditLine(line)));
    const awards = project.awards || [];
    infoField('awards-block').hidden = !awards.length;
    const awardsText = infoField('awards');
    awardsText.textContent = '';
    awards.forEach(award => awardsText.appendChild(awardLine(award)));
    infoOpener = opener;
    infoSheet.classList.add('is-open');
    infoSheet.setAttribute('aria-hidden', 'false');
    infoClose.focus({ preventScroll: true });
    infoCard.scrollTop = 0;
    updateInfoMore();
    requestAnimationFrame(updateInfoMore);
  }

  const infoCard = infoSheet.querySelector('.info-card');

  function updateInfoMore() {
    const overflows = infoOpen() && infoCard.scrollHeight - infoCard.clientHeight > 1;
    infoCard.classList.toggle('has-less', overflows && infoCard.scrollTop > 1);
    infoCard.classList.toggle('has-more', overflows &&
      infoCard.scrollHeight - infoCard.scrollTop - infoCard.clientHeight > 1);
  }

  infoCard.addEventListener('scroll', updateInfoMore, { passive: true });
  window.addEventListener('resize', updateInfoMore);

  function closeInfo() {
    if (!infoOpen()) return;
    infoSheet.classList.remove('is-open');
    infoSheet.setAttribute('aria-hidden', 'true');
    updateInfoMore();
    if (infoOpener) infoOpener.focus({ preventScroll: true });
    infoOpener = null;
  }

  infoClose.addEventListener('click', closeInfo);
  infoSheet.addEventListener('click', event => {
    if (!event.target.closest('.info-card')) closeInfo();
  });

  window.JU = Object.assign(window.JU || {}, { openInfo, closeInfo, infoOpen });

  Object.assign(window.JU, { setView, getView: () => view, morphHalo });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    document.body.classList.add('is-resizing');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => document.body.classList.remove('is-resizing'), 200);
  });

  tick();
  updateControls();

  if (viewFromHash() !== 'home') {
    document.body.classList.add('is-resizing');
    applyView(viewFromHash());

    setTimeout(() => document.body.classList.remove('is-resizing'), 100);
  }
})();
