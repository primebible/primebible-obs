(function() {
  'use strict';

  // State
  let currentVerse = null;
  let wsConnected = false;

  // Optional PIN (remotePin in config.json). Accept it from the page URL
  // (?pin=1234), remember it, and prompt if the server rejects us.
  const urlPin = new URLSearchParams(location.search).get('pin');
  if (urlPin) localStorage.setItem('primebible-pin', urlPin);
  let pin = urlPin || localStorage.getItem('primebible-pin') || '';

  function buildWsUrl() {
    const base = `${location.origin.replace('http', 'ws')}/?role=remote`;
    return pin ? `${base}&pin=${encodeURIComponent(pin)}` : base;
  }

  let ws = null;
  let reconnectDelay = 2000;

  // Elements
  const els = {
    wsStatus: document.getElementById('wsStatus'),
    statusText: document.getElementById('statusText'),
    refInput: document.getElementById('refInput'),
    translationSelect: document.getElementById('translationSelect'),
    themeSelect: document.getElementById('themeSelect'),
    goLiveBtn: document.getElementById('goLiveBtn'),
    hideBtn: document.getElementById('hideBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    liveStatus: document.getElementById('liveStatus')
  };

  // WebSocket — retries forever with capped backoff
  function connectWebSocket() {
    ws = new WebSocket(buildWsUrl());

    ws.addEventListener('open', () => {
      console.log('[Remote] Connected');
      wsConnected = true;
      reconnectDelay = 2000;
      updateStatus('Connected');
    });

    ws.addEventListener('close', (event) => {
      console.log('[Remote] Disconnected');
      wsConnected = false;

      if (event.code === 4001) {
        // Server requires a PIN (or ours is wrong)
        const entered = prompt('This server requires a PIN. Enter the remote PIN:');
        if (entered !== null) {
          pin = entered.trim();
          localStorage.setItem('primebible-pin', pin);
          connectWebSocket();
        } else {
          // User declined — don't hammer the server with doomed retries.
          updateStatus('PIN required — reload to retry');
        }
        return;
      }

      updateStatus('Disconnected');
      setTimeout(connectWebSocket, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
    });

    ws.addEventListener('error', () => {
      updateStatus('Connection error');
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error('[Remote] Message error:', e);
      }
    });
  }

  // Populate a <select> from the server's option list, keeping the current
  // choice when it still exists.
  function populateSelect(select, options, preferred) {
    const previous = select.value;
    select.innerHTML = '';
    for (const o of options) {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      select.appendChild(opt);
    }
    const values = options.map(o => o.value);
    if (values.includes(previous)) select.value = previous;
    else if (preferred && values.includes(preferred)) select.value = preferred;
  }

  let defaultAnimation = 'fade';

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        // Offer only translations/themes the server will actually honor
        if (msg.config) {
          if (msg.config.defaultAnimation) defaultAnimation = msg.config.defaultAnimation;
          if (Array.isArray(msg.config.translations) && msg.config.translations.length) {
            populateSelect(
              els.translationSelect,
              msg.config.translations.map(t => ({ value: String(t).toLowerCase(), label: String(t).toUpperCase() })),
              String(msg.config.defaultTranslation || '').toLowerCase()
            );
          }
          if (Array.isArray(msg.config.themes) && msg.config.themes.length) {
            populateSelect(
              els.themeSelect,
              msg.config.themes.map(t => ({ value: t.id, label: t.name })),
              msg.config.defaultTheme
            );
          }
        }
        break;
    }
  }

  function updateStatus(text) {
    els.statusText.textContent = text;
    els.wsStatus.className = wsConnected ? 'status-dot online' : 'status-dot offline';
  }

  function showFeedback(text, type = 'info') {
    const colors = {
      success: 'var(--accent)',
      error: 'var(--danger)',
      info: 'var(--primary)'
    };

    els.liveStatus.innerHTML = `
      <div style="color: ${colors[type]}; font-weight: 600; font-size: 0.875rem;">
        ${text}
      </div>
    `;

    setTimeout(() => {
      els.liveStatus.innerHTML = '';
    }, 3000);
  }

  // Fetch and go live
  els.goLiveBtn.addEventListener('click', async () => {
    const ref = els.refInput.value.trim();
    
    if (!ref) {
      showFeedback('⚠️ Enter a reference first', 'error');
      return;
    }

    if (!wsConnected) {
      showFeedback('⚠️ Not connected to server', 'error');
      return;
    }

    // Provide haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const translation = els.translationSelect.value;
    const theme = els.themeSelect.value;

    try {
      // Fetch verse
      const response = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}&translation=${encodeURIComponent(translation)}`);
      const json = await response.json();

      if (json.ok) {
        currentVerse = json.data;
        
        // Send to overlay
        ws.send(JSON.stringify({
          type: 'goLive',
          payload: currentVerse,
          theme,
          animation: defaultAnimation,
          autoShowOverlay: true
        }));

        els.liveStatus.innerHTML = '<span class="live-badge">🔴 LIVE</span>';
        
        setTimeout(() => {
          els.liveStatus.innerHTML = '';
        }, 5000);

      } else {
        showFeedback('✗ Verse not found', 'error');
      }
    } catch (error) {
      console.error('[Remote] Error:', error);
      showFeedback('✗ Connection error', 'error');
    }
  });

  // Hide overlay
  els.hideBtn.addEventListener('click', () => {
    if (!wsConnected) {
      showFeedback('⚠️ Not connected', 'error');
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    ws.send(JSON.stringify({ type: 'hideOverlay' }));
    showFeedback('✓ Hidden', 'info');
  });

  // Navigation
  els.prevBtn.addEventListener('click', () => {
    if (!wsConnected) return;
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    ws.send(JSON.stringify({ type: 'previousSlide' }));
  });

  els.nextBtn.addEventListener('click', () => {
    if (!wsConnected) return;
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    ws.send(JSON.stringify({ type: 'nextSlide' }));
  });

  // Quick references
  document.querySelectorAll('.quick-ref-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ref = btn.getAttribute('data-ref');
      els.refInput.value = ref;
      
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      
      showFeedback(`Selected: ${ref}`, 'info');
    });
  });

  // Enter key support
  els.refInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      els.goLiveBtn.click();
    }
  });

  // Prevent zoom on double tap for iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Auto-focus input on load (mobile-friendly)
  setTimeout(() => {
    els.refInput.focus();
  }, 500);

  connectWebSocket();
  console.log('[Remote] Ready');
})();
