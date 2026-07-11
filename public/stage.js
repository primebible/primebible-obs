(function() {
  'use strict';

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

  function slidesFor(p) {
    if (!p) return [];
    return Array.isArray(p.slides) && p.slides.length ? p.slides
      : [(p.verses || []).map(v => (v.verse ? `${v.verse} ${v.text}` : v.text)).join(' ')];
  }

  // Verse text carries basic formatting tags (<strong>, <i>) that the overlay
  // renders; the stage is plain text, so strip them instead of showing them raw.
  function plainText(text) {
    return String(text || '').replace(/<\/?(strong|b|i|u)>/gi, '');
  }

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
    const slides = slidesFor(payload);
    const cur = slides[Math.max(0, Math.min(slideIndex, slides.length - 1))] || '';
    const nxt = slides[Math.min(slideIndex + 1, slides.length - 1)] || '';

    refText.textContent = ref;
    trText.textContent = tr ? `(${tr})` : '';
    currentEl.textContent = plainText(cur);
    nextEl.textContent = slideIndex + 1 < slides.length ? plainText(nxt) : '';
  }

  // Present a running ticker on the confidence monitor as a single "slide"
  function tickerPayload(text) {
    return { reference: 'Ticker', translationName: '', slides: [String(text || '')] };
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        // Replay whatever is currently live so a stage display opened (or
        // reconnected) mid-service shows the speaker the right content.
        if (msg.currentLive && msg.currentLive.payload) {
          payload = msg.currentLive.payload;
          slideIndex = Number(msg.currentLive.slideIndex) || 0;
          render();
        } else if (msg.currentLive && msg.currentLive.ticker) {
          payload = tickerPayload(msg.currentLive.ticker.text);
          slideIndex = 0;
          render();
        }
        break;
      case 'ticker':
        // The ticker replaces the live verse — mirror that here instead of
        // leaving a stale verse in front of the speaker.
        payload = msg.action === 'stop' ? null : tickerPayload(msg.text);
        slideIndex = 0;
        render();
        break;
      case 'forceRefresh':
        window.location.reload();
        break;
      case 'displayVerse':
        payload = msg.payload;
        slideIndex = 0;
        render();
        break;
      case 'nextSlide':
        // Clamp like the overlay does, or the stored index desyncs from
        // what the audience sees after over-pressing Next.
        slideIndex = Math.min(slideIndex + 1, Math.max(0, slidesFor(payload).length - 1));
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
  }

  // WebSocket — retries forever with capped backoff so the confidence
  // monitor never silently freezes after a server restart. The PIN (when
  // configured) rides along from the page URL (?pin=).
  const pagePin = new URLSearchParams(location.search).get('pin') || '';
  const wsUrl = `${location.origin.replace('http', 'ws')}/?role=stage${pagePin ? `&pin=${encodeURIComponent(pagePin)}` : ''}`;
  let ws = null;
  let reconnectDelay = 1000;

  function connectWebSocket() {
    ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => { reconnectDelay = 1000; });
    ws.addEventListener('close', () => {
      setTimeout(connectWebSocket, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
    });
    ws.addEventListener('error', () => {});
    ws.addEventListener('message', (ev) => {
      try {
        handleMessage(JSON.parse(ev.data));
      } catch (e) {
        console.error('[Stage] message error', e);
      }
    });
  }
  connectWebSocket();
})();
