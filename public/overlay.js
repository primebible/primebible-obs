(function() {
  'use strict';

  const root = document.getElementById('root');
  const params = new URLSearchParams(location.search);
  
  let currentTheme = params.get('theme') || 'glass-lower';
  let currentAnimation = params.get('animation') || 'fade';
  let currentPayload = null;
  let currentSlideIndex = 0;
  let overlayElement = null;
  let autoAdvanceTimer = null;

  // Apply safe-area and high-contrast from URL params
  const safeAreaBottom = params.get('safeBottom') || '0';
  const safeAreaTop = params.get('safeTop') || '0';
  const highContrast = params.get('highContrast') === 'true';

  if (safeAreaBottom !== '0' || safeAreaTop !== '0') {
    document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
    root.classList.add('safe-area-applied');
  }

  if (highContrast) {
    root.classList.add('high-contrast');
  }

  // Connect to WebSocket
  const wsUrl = `${location.origin.replace('http', 'ws')}/?role=overlay`;
  let ws = new WebSocket(wsUrl);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

  ws.addEventListener('open', () => {
    console.log('[Overlay] Connected');
    reconnectAttempts = 0;
  });

  ws.addEventListener('close', () => {
    console.log('[Overlay] Disconnected');
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        ws = new WebSocket(wsUrl);
        setupWebSocket();
      }, 2000 * reconnectAttempts);
    }
  });

  ws.addEventListener('error', (err) => {
    console.error('[Overlay] WebSocket error:', err);
  });

  function setupWebSocket() {
    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error('[Overlay] Message parse error:', e);
      }
    });
  }

  setupWebSocket();

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        if (msg.config) {
          currentTheme = params.get('theme') || msg.config.defaultTheme || 'glass-lower';
          currentAnimation = params.get('animation') || msg.config.defaultAnimation || 'fade';
        }
        break;

      case 'displayVerse':
        if (msg.payload) {
          displayVerse(msg.payload, msg.theme, msg.animation);
        }
        break;

      case 'hideVerse':
        hideOverlay();
        break;

      case 'setTheme':
        if (msg.theme) {
          currentTheme = msg.theme;
          if (currentPayload) {
            displayVerse(currentPayload, currentTheme, currentAnimation);
          }
        }
        break;

      case 'setAnimation':
        if (msg.animation) {
          currentAnimation = msg.animation;
        }
        break;

      case 'nextSlide':
        nextSlide();
        break;

      case 'previousSlide':
        previousSlide();
        break;

      case 'ticker':
        handleTicker(msg);
        break;
    }
  }

  function displayVerse(payload, theme, animation) {
    currentPayload = payload;
    currentSlideIndex = 0;
    
    if (theme) currentTheme = theme;
    if (animation) currentAnimation = animation;

    // Clear any existing overlay
    hideOverlay(true);

    // Build the overlay
    setTimeout(() => {
      overlayElement = buildTheme(currentTheme, payload, 0);
      if (overlayElement) {
        overlayElement.classList.add(`anim-${currentAnimation}`);
        overlayElement.classList.add('overlay-hidden');
        root.appendChild(overlayElement);
        
        // Trigger show animation
        requestAnimationFrame(() => {
          overlayElement.classList.remove('overlay-hidden');
        });
      }
    }, 50);
  }

  function hideOverlay(instant = false) {
    clearAutoAdvance();
    
    if (overlayElement) {
      if (instant) {
        overlayElement.remove();
        overlayElement = null;
      } else {
        overlayElement.classList.add('overlay-hidden');
        setTimeout(() => {
          if (overlayElement) {
            overlayElement.remove();
            overlayElement = null;
          }
        }, 500);
      }
    }
  }

  function buildTheme(theme, payload, slideIndex) {
    const slides = payload.slides || [];
    const currentSlide = slides[slideIndex] || payload.fullText || '';
    const ref = payload.reference || '';
    const tr = payload.translationName || payload.translationId;

    switch (theme) {
      case 'glass-lower':
        return buildGlassLower(currentSlide, ref, tr, slideIndex, slides.length);
      
      case 'minimal-center':
        return buildMinimalCenter(currentSlide, ref, tr);
      
      case 'full-screen':
        return buildFullScreen(currentSlide, ref, tr, slideIndex, slides.length);
      
      case 'split-side':
        return buildSplitSide(currentSlide, ref, tr, slideIndex, slides.length);
      
      case 'corner-card':
        return buildCornerCard(currentSlide, ref, tr);
      
      case 'ticker':
        return buildTicker(payload.fullText || currentSlide);
      
      default:
        return buildGlassLower(currentSlide, ref, tr, slideIndex, slides.length);
    }
  }

  function buildGlassLower(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-glass-lower';
    el.innerHTML = `
      <div class="glass-lower-content">
        <div class="glass-lower-verse">${escapeHtml(verse)}</div>
        <div class="glass-lower-meta">
          <div class="glass-lower-ref">${escapeHtml(ref)}</div>
          <div class="glass-lower-tr">${escapeHtml(tr)}</div>
          ${total > 1 ? `<div class="glass-lower-slide-indicator">${index + 1} / ${total}</div>` : ''}
        </div>
      </div>
    `;
    return el;
  }

  function buildMinimalCenter(verse, ref, tr) {
    const el = document.createElement('div');
    el.className = 'theme-minimal-center';
    el.innerHTML = `
      <div class="minimal-center-content">
        <div class="minimal-center-verse">${escapeHtml(verse)}</div>
        <div class="minimal-center-meta">
          <span>${escapeHtml(ref)}</span>
          <span class="minimal-center-dot"></span>
          <span>${escapeHtml(tr)}</span>
        </div>
      </div>
    `;
    return el;
  }

  function buildFullScreen(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-full-screen';
    el.innerHTML = `
      <div class="full-screen-content">
        <div class="full-screen-verse">${escapeHtml(verse)}</div>
        <div class="full-screen-meta">
          <div class="full-screen-ref">${escapeHtml(ref)}</div>
          <div class="full-screen-tr">${escapeHtml(tr)}</div>
          ${total > 1 ? `<div class="full-screen-tr">${index + 1} of ${total}</div>` : ''}
        </div>
      </div>
    `;
    return el;
  }

  function buildSplitSide(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-split-side';
    el.innerHTML = `
      <div class="split-side-meta">
        <div class="split-side-ref">${escapeHtml(ref)}</div>
        <div class="split-side-tr">${escapeHtml(tr)} ${total > 1 ? `• ${index + 1}/${total}` : ''}</div>
      </div>
      <div class="split-side-verse">${escapeHtml(verse)}</div>
    `;
    return el;
  }

  function buildCornerCard(verse, ref, tr) {
    const el = document.createElement('div');
    el.className = 'theme-corner-card';
    el.innerHTML = `
      <div class="corner-card-content">
        <div class="corner-card-meta">
          <div class="corner-card-ref">${escapeHtml(ref)}</div>
          <div class="corner-card-tr">${escapeHtml(tr)}</div>
        </div>
        <div class="corner-card-verse">${escapeHtml(verse)}</div>
      </div>
    `;
    return el;
  }

  function buildTicker(text) {
    const el = document.createElement('div');
    el.className = 'theme-ticker';
    const repeated = `${text}   •   ${text}   •   ${text}   •   `;
    el.innerHTML = `<div class="ticker-track">${escapeHtml(repeated)}</div>`;
    return el;
  }

  function handleTicker(msg) {
    if (msg.action === 'start') {
      const payload = {
        fullText: msg.text,
        reference: '',
        translationName: ''
      };
      displayVerse(payload, 'ticker', 'fade');
    } else if (msg.action === 'stop') {
      hideOverlay();
    }
  }

  function nextSlide() {
    if (!currentPayload || !currentPayload.slides) return;
    
    const slides = currentPayload.slides;
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
      displayVerse(currentPayload, currentTheme, currentAnimation);
    }
  }

  function previousSlide() {
    if (!currentPayload || !currentPayload.slides) return;
    
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      displayVerse(currentPayload, currentTheme, currentAnimation);
    }
  }

  function clearAutoAdvance() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Keyboard shortcuts (for testing in browser)
  if (window.self === window.top) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') previousSlide();
      if (e.key === 'Escape') hideOverlay();
    });
  }

  console.log('[Overlay] Ready • Theme:', currentTheme, '• Animation:', currentAnimation);
})();
