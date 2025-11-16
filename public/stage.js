(function() {
  'use strict';

  const params = new URLSearchParams(location.search);
  const ws = new WebSocket(`${location.origin.replace('http', 'ws')}/?role=stage`);

  let payload = null;
  let slideIndex = 0;

  const refText = document.getElementById('refText');
  const trText = document.getElementById('trText');
  const currentEl = document.getElementById('current');
  const nextEl = document.getElementById('next');
  const clockEl = document.getElementById('clock');

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  function render() {
    if (!payload) {
      refText.textContent = '';
      trText.textContent = '';
      currentEl.textContent = '';
      nextEl.textContent = '';
      return;
    }
    const ref = payload.reference || '';
    const tr = payload.translationName || payload.translationId || '';
    const slides = Array.isArray(payload.slides) && payload.slides.length ? payload.slides
      : [(payload.verses || []).map(v => (v.verse ? `${v.verse} ${v.text}` : v.text)).join(' ')];
    const cur = slides[Math.max(0, Math.min(slideIndex, slides.length - 1))] || '';
    const nxt = slides[Math.min(slideIndex + 1, slides.length - 1)] || '';

    refText.textContent = ref;
    trText.textContent = tr ? `(${tr})` : '';
    currentEl.textContent = cur;
    nextEl.textContent = slideIndex + 1 < slides.length ? nxt : '';
  }

  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      switch (msg.type) {
        case 'hello':
          // ignore; nothing to configure yet
          break;
        case 'displayVerse':
          payload = msg.payload;
          slideIndex = 0;
          render();
          break;
        case 'setTheme':
        case 'setAnimation':
          // Not used in stage view
          break;
        case 'nextSlide':
          slideIndex++;
          render();
          break;
        case 'previousSlide':
          slideIndex = Math.max(0, slideIndex - 1);
          render();
          break;
        case 'hideVerse':
          payload = null;
          slideIndex = 0;
          render();
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('[Stage] message error', e);
    }
  });
})();