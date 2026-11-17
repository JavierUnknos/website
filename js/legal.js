/*
Design & Development by JAVIER UNKNOS
javierunknos.com
©2026 All rights reserved.
*/
(() => {
  'use strict';

  const html = document.documentElement;

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('.legal-close').click();
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
  const bars = [document.querySelector('.toolbar'), document.querySelector('.footer')];
  const FALLBACK_ZONE = 'Europe/Madrid';

  let timeZone = FALLBACK_ZONE;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_ZONE;
  } catch (error) {}

  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const zoneFormat = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' });

  function fitBars() {
    footer.style.setProperty('--clock-width', `${clock.parentElement.offsetWidth}px`);
    const top = Math.min(...bars.map(bar => bar.getBoundingClientRect().top));
    html.style.setProperty('--legal-bars-h', `${Math.ceil(window.innerHeight - top)}px`);
  }

  function tick() {
    const now = new Date();
    const time = timeFormat.format(now);
    clockHm.textContent = time.slice(0, 5);
    clockS.textContent = time.slice(5);
    clock.dateTime = now.toISOString();
    const zone = zoneFormat.formatToParts(now).find(part => part.type === 'timeZoneName');
    clockZone.textContent = zone ? zone.value.replace('GMT', 'UTC') : 'UTC';
    fitBars();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  function placeHeading() {
    if (!html.classList.contains('is-phone')) return;
    const line = 15;
    const margin = 10;
    const probe = document.createElement('p');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0;margin:0';
    probe.innerHTML = '<span>info@javierunknos.com</span><br><span style="display:inline-flex;column-gap:var(--gap)"><span style="width:var(--num-col)">03</span> About</span>';
    document.body.appendChild(probe);
    const mailWidth = probe.children[0].getBoundingClientRect().width;
    const aboutWidth = probe.children[2].scrollWidth;
    probe.remove();
    const width = html.clientWidth;
    const middle2 = Math.round(width / 2);
    let col2 = Math.min(middle2, width - margin - (2 * line + 8 + mailWidth));
    if (col2 - (margin + aboutWidth) < 2 * line + margin) col2 = middle2;
    html.style.setProperty('--m-col2', `${Math.round(col2)}px`);
  }

  placeHeading();
  tick();
  window.addEventListener('resize', () => { placeHeading(); fitBars(); });
})();
