(function() {
  'use strict';

  // State
  let currentVerse = null;
  let wsConnected = false;

  // WebSocket
  const wsUrl = `${location.origin.replace('http', 'ws')}/?role=remote`;
  let ws = new WebSocket(wsUrl);

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

  // WebSocket handlers
  ws.addEventListener('open', () => {
    console.log('[Remote] Connected');
    wsConnected = true;
    updateStatus('Connected');
  });

  ws.addEventListener('close', () => {
    console.log('[Remote] Disconnected');
    wsConnected = false;
    updateStatus('Disconnected');
    
    // Attempt reconnect
    setTimeout(() => {
      ws = new WebSocket(wsUrl);
      setupWebSocket();
    }, 2000);
  });

  ws.addEventListener('error', (err) => {
    console.error('[Remote] Error:', err);
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

  function setupWebSocket() {
    ws.addEventListener('open', () => {
      wsConnected = true;
      updateStatus('Connected');
    });
    
    ws.addEventListener('close', () => {
      wsConnected = false;
      updateStatus('Disconnected');
    });
    
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    });
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        console.log('[Remote] Hello received');
        break;
      
      case 'verseResult':
        if (msg.ok && msg.data) {
          currentVerse = msg.data;
          showFeedback(`✓ Loaded: ${currentVerse.reference}`, 'success');
        } else {
          showFeedback('✗ Failed to load verse', 'error');
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
          animation: 'fade',
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

  console.log('[Remote] Ready');
})();
