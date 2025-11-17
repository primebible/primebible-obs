(function() {
  'use strict';

  // State
  let currentVerse = null;
  let history = [];
  let favorites = [];
  let servicePlan = [];
  let obsConnected = false;
  let wsConnected = false;
  
  // Background customization state
  let bgColor = localStorage.getItem('primebible-bg-color') || '#000000';
  let bgTransparency = parseInt(localStorage.getItem('primebible-bg-transparency') || '75');
  let solidBackground = localStorage.getItem('primebible-bg-solid') === 'true';
  
  // Font customization state
  let verseFont = localStorage.getItem('primebible-verse-font') || 'poppins';
  let referenceFont = localStorage.getItem('primebible-ref-font') || 'montserrat';
  
  // Font size state
  let verseFontSize = parseInt(localStorage.getItem('primebible-verse-size') || '100');
  let referenceFontSize = parseInt(localStorage.getItem('primebible-ref-size') || '100');

  // WebSocket
  const wsUrl = `${location.origin.replace('http', 'ws')}/?role=control`;
  let ws = new WebSocket(wsUrl);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

  // Elements
  const els = {
    wsStatus: document.getElementById('wsStatus'),
    obsStatus: document.getElementById('obsStatus'),
    bgColorPicker: document.getElementById('bgColorPicker'),
    transparencySlider: document.getElementById('transparencySlider'),
    transparencyValue: document.getElementById('transparencyValue'),
    bgPreview: document.getElementById('bgPreview'),
    applyBgBtn: document.getElementById('applyBgBtn'),
    solidBgCheckbox: document.getElementById('solidBgCheckbox'),
    fontPreview: document.getElementById('fontPreview'),
    verseFontSelect: document.getElementById('verseFontSelect'),
    referenceFontSelect: document.getElementById('referenceFontSelect'),
    applyFontsBtn: document.getElementById('applyFontsBtn'),
    verseSizeSlider: document.getElementById('verseSizeSlider'),
    verseSizeValue: document.getElementById('verseSizeValue'),
    referenceSizeSlider: document.getElementById('referenceSizeSlider'),
    referenceSizeValue: document.getElementById('referenceSizeValue'),
    applySizesBtn: document.getElementById('applySizesBtn'),
    refInput: document.getElementById('refInput'),
    translationSelect: document.getElementById('translationSelect'),
    themeSelect: document.getElementById('themeSelect'),
    animationSelect: document.getElementById('animationSelect'),
    fetchBtn: document.getElementById('fetchBtn'),
    goLiveBtn: document.getElementById('goLiveBtn'),
    hideBtn: document.getElementById('hideBtn'),
    prevSlideBtn: document.getElementById('prevSlideBtn'),
    nextSlideBtn: document.getElementById('nextSlideBtn'),
    preview: document.getElementById('preview'),
    liveStatus: document.getElementById('liveStatus'),
    history: document.getElementById('history'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    favorites: document.getElementById('favorites'),
    addFavoriteBtn: document.getElementById('addFavoriteBtn'),
    servicePlan: document.getElementById('servicePlan'),
    addToPlanBtn: document.getElementById('addToPlanBtn'),
    clearPlanBtn: document.getElementById('clearPlanBtn'),
    obsUrl: document.getElementById('obsUrl'),
    obsPassword: document.getElementById('obsPassword'),
    obsConnectBtn: document.getElementById('obsConnectBtn'),
    obsEnsureBtn: document.getElementById('obsEnsureBtn'),
    qrCode: document.getElementById('qrCode'),
    remoteUrl: document.getElementById('remoteUrl'),
    forceRefreshBtn: document.getElementById('forceRefreshBtn'),
    enableDrawingBtn: document.getElementById('enableDrawingBtn'),
    disableDrawingBtn: document.getElementById('disableDrawingBtn'),
    clearDrawingBtn: document.getElementById('clearDrawingBtn')
  };

  // Initialize saved values
  els.bgColorPicker.value = bgColor;
  els.transparencySlider.value = bgTransparency;
   if (els.solidBgCheckbox) {
    els.solidBgCheckbox.checked = solidBackground;
  }
  els.verseFontSelect.value = verseFont;
  els.referenceFontSelect.value = referenceFont;
  els.verseSizeSlider.value = verseFontSize;
  els.referenceSizeSlider.value = referenceFontSize;

  // Background customization handlers
  function updateBgPreview() {
    const alpha = bgTransparency / 100;
    const rgb = hexToRgb(bgColor);
    const bgValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    
    els.bgPreview.style.background = bgValue;
    els.transparencyValue.textContent = `${bgTransparency}%`;
  }

  function updateFontPreview() {
    const fontMap = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'poppins': '"Poppins", sans-serif',
      'lora': '"Lora", serif',
      'merriweather': '"Merriweather", serif',
      'roboto': '"Roboto", sans-serif',
      'montserrat': '"Montserrat", sans-serif',
      'opensans': '"Open Sans", sans-serif'
    };

    const verseEl = els.fontPreview.querySelector('.font-preview-verse');
    const refEl = els.fontPreview.querySelector('.font-preview-ref');
    
    if (verseEl) {
      verseEl.style.fontFamily = fontMap[verseFont];
      verseEl.style.fontSize = `${1.125 * verseFontSize / 100}rem`;
    }
    
    if (refEl) {
      refEl.style.fontFamily = fontMap[referenceFont];
      refEl.style.fontSize = `${0.875 * referenceFontSize / 100}rem`;
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  els.bgColorPicker.addEventListener('input', (e) => {
    bgColor = e.target.value;
    updateBgPreview();
  });

  els.transparencySlider.addEventListener('input', (e) => {
    bgTransparency = parseInt(e.target.value);
    updateBgPreview();
  });

  if (els.solidBgCheckbox) {
    els.solidBgCheckbox.addEventListener('change', (e) => {
      solidBackground = e.target.checked;
    });
  }

  els.applyBgBtn.addEventListener('click', () => {
    const alpha = bgTransparency / 100;
    
    // Save to localStorage
    localStorage.setItem('primebible-bg-color', bgColor);
    localStorage.setItem('primebible-bg-transparency', bgTransparency);
    localStorage.setItem('primebible-bg-solid', solidBackground ? 'true' : 'false');
    
    ws.send(JSON.stringify({
      type: 'setBackground',
      color: bgColor,
      transparency: alpha,
      solidBackground: solidBackground
    }));

    // Visual feedback
    els.applyBgBtn.innerHTML = '<span>✓ Applied!</span>';
    setTimeout(() => {
      els.applyBgBtn.innerHTML = '<span>Apply Background</span>';
    }, 2000);
  });

  els.forceRefreshBtn.addEventListener('click', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'forceRefresh'
    }));

    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'setBackground',
        color: bgColor,
        transparency: bgTransparency / 100,
        solidBackground: solidBackground
      }));

      ws.send(JSON.stringify({
        type: 'setFonts',
        verseFont: verseFont,
        referenceFont: referenceFont
      }));

      ws.send(JSON.stringify({
        type: 'setFontSizes',
        verseSize: verseFontSize / 100,
        referenceSize: referenceFontSize / 100
      }));
    }, 100);

    els.forceRefreshBtn.innerHTML = '<span>✓ Refreshed!</span>';
    setTimeout(() => {
      els.forceRefreshBtn.innerHTML = '<span>🔄 Force Refresh OBS Overlay</span>';
    }, 2000);
  });

  // Font customization handlers
  els.verseFontSelect.addEventListener('change', (e) => {
    verseFont = e.target.value;
    updateFontPreview();
  });

  els.referenceFontSelect.addEventListener('change', (e) => {
    referenceFont = e.target.value;
    updateFontPreview();
  });

  els.applyFontsBtn.addEventListener('click', () => {
    // Save to localStorage
    localStorage.setItem('primebible-verse-font', verseFont);
    localStorage.setItem('primebible-ref-font', referenceFont);
    
    ws.send(JSON.stringify({
      type: 'setFonts',
      verseFont: verseFont,
      referenceFont: referenceFont
    }));

    // Visual feedback
    els.applyFontsBtn.innerHTML = '<span>✓ Applied!</span>';
    setTimeout(() => {
      els.applyFontsBtn.innerHTML = '<span>Apply Fonts</span>';
    }, 2000);
  });

  // Font size handlers
  els.verseSizeSlider.addEventListener('input', (e) => {
    verseFontSize = parseInt(e.target.value);
    els.verseSizeValue.textContent = `${verseFontSize}%`;
    updateFontPreview();
  });

  els.referenceSizeSlider.addEventListener('input', (e) => {
    referenceFontSize = parseInt(e.target.value);
    els.referenceSizeValue.textContent = `${referenceFontSize}%`;
    updateFontPreview();
  });

  els.applySizesBtn.addEventListener('click', () => {
    // Save to localStorage
    localStorage.setItem('primebible-verse-size', verseFontSize);
    localStorage.setItem('primebible-ref-size', referenceFontSize);
    
    ws.send(JSON.stringify({
      type: 'setFontSizes',
      verseSize: verseFontSize / 100,
      referenceSize: referenceFontSize / 100
    }));

    // Visual feedback
    els.applySizesBtn.innerHTML = '<span>✓ Applied!</span>';
    setTimeout(() => {
      els.applySizesBtn.innerHTML = '<span>Apply Font Sizes</span>';
    }, 2000);
  });

  // Initialize previews
  updateBgPreview();
  updateFontPreview();
  els.verseSizeValue.textContent = `${verseFontSize}%`;
  els.referenceSizeValue.textContent = `${referenceFontSize}%`;

  // Apply saved settings on connection
  function applyStoredSettings() {
    if (!wsConnected) return;
    
    // Apply background
    ws.send(JSON.stringify({
      type: 'setBackground',
      color: bgColor,
      transparency: bgTransparency / 100,
      solidBackground: solidBackground
    }));
    
    // Apply fonts
    ws.send(JSON.stringify({
      type: 'setFonts',
      verseFont: verseFont,
      referenceFont: referenceFont
    }));
    
    // Apply sizes
    ws.send(JSON.stringify({
      type: 'setFontSizes',
      verseSize: verseFontSize / 100,
      referenceSize: referenceFontSize / 100
    }));
  }

  // WebSocket handlers
  ws.addEventListener('open', () => {
    console.log('[Control] Connected');
    wsConnected = true;
    reconnectAttempts = 0;
    updateConnectionStatus();
    
    // Apply stored settings after connection
    setTimeout(applyStoredSettings, 100);
  });

  ws.addEventListener('close', () => {
    console.log('[Control] Disconnected');
    wsConnected = false;
    updateConnectionStatus();
    // Attempt reconnect with exponential backoff
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
      setTimeout(() => {
        reconnectAttempts++;
        ws = new WebSocket(wsUrl);
        setupWebSocket();
      }, delay);
    }
  });

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      console.error('[Control] Message error:', e);
    }
  });

  function setupWebSocket() {
    ws.addEventListener('open', () => {
      wsConnected = true;
      reconnectAttempts = 0;
      updateConnectionStatus();
      setTimeout(applyStoredSettings, 100);
    });
    
    ws.addEventListener('close', () => {
      wsConnected = false;
      updateConnectionStatus();
    });
    
    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error('[Control] Message parse error:', e);
      }
    });
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        if (msg.history) history = msg.history;
        if (msg.favorites) favorites = msg.favorites;
        if (msg.servicePlan) servicePlan = msg.servicePlan;
        obsConnected = msg.config?.obsConnected || false;
        renderAll();
        break;

      case 'state':
        if (msg.history) history = msg.history;
        if (msg.favorites) favorites = msg.favorites;
        if (msg.servicePlan) servicePlan = msg.servicePlan;
        obsConnected = msg.obsConnected || false;
        renderAll();
        break;

      case 'historyUpdated':
        if (msg.history) history = msg.history;
        renderHistory();
        break;

      case 'favoritesUpdated':
        if (msg.favorites) favorites = msg.favorites;
        renderFavorites();
        break;

      case 'servicePlanUpdated':
        if (msg.plan) servicePlan = msg.plan;
        renderServicePlan();
        break;

      case 'obsStatusChanged':
        obsConnected = msg.connected;
        updateConnectionStatus();
        break;
    }
  }

  function updateConnectionStatus() {
    // WebSocket status
    els.wsStatus.className = wsConnected ? 'status-dot online' : 'status-dot offline';
    els.wsStatus.setAttribute('data-tooltip', wsConnected ? 'Connected' : 'Disconnected');

    // OBS status
    if (obsConnected) {
      els.obsStatus.innerHTML = '<span class="badge badge-success"><span class="status-dot online"></span> OBS Connected</span>';
      els.obsEnsureBtn.disabled = false;
    } else {
      els.obsStatus.innerHTML = '<span class="badge"><span class="status-dot offline"></span> OBS Offline</span>';
      els.obsEnsureBtn.disabled = true;
    }
  }

  // Fetch verse
  els.fetchBtn.addEventListener('click', fetchVerse);
  els.refInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      fetchVerse();
    }
  });
  
  async function fetchVerse() {
    const ref = els.refInput.value.trim();
    if (!ref) return;

    const translation = els.translationSelect.value;
    
    els.fetchBtn.disabled = true;
    els.fetchBtn.innerHTML = '<span class="animate-spin">⏳</span> <span>Fetching...</span>';

    try {
      const response = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}&translation=${encodeURIComponent(translation)}`);
      const json = await response.json();

      if (json.ok) {
        currentVerse = json.data;
        renderPreview(currentVerse);
        els.goLiveBtn.disabled = false;
        els.addToPlanBtn.disabled = false;
        els.addFavoriteBtn.disabled = false;
      } else {
        showError(json.error || 'Failed to fetch verse');
        els.goLiveBtn.disabled = true;
      }
    } catch (error) {
      showError(String(error));
      els.goLiveBtn.disabled = true;
    } finally {
      els.fetchBtn.disabled = false;
      els.fetchBtn.innerHTML = '<span>Fetch Verse</span>';
    }
  }

  function renderPreview(verse) {
    if (!verse) {
      els.preview.textContent = 'Fetch a verse to see the preview here';
      els.preview.classList.remove('has-content');
      return;
    }

    const lines = [];
    lines.push(`${verse.reference} (${verse.translationName})`);
    lines.push('');
    
    if (verse.slides && verse.slides.length > 0) {
      verse.slides.forEach((slide, i) => {
        lines.push(`[Slide ${i + 1} of ${verse.slides.length}]`);
        lines.push(slide);
        lines.push('');
      });
    } else {
      lines.push(verse.fullText);
    }

    els.preview.textContent = lines.join('\n');
    els.preview.classList.add('has-content');
  }

  function showError(message) {
    els.preview.textContent = `❌ Error: ${message}`;
    els.preview.classList.add('has-content');
  }

  // Go live
  els.goLiveBtn.addEventListener('click', goLive);

  function goLive() {
    if (!currentVerse) return;

    const theme = els.themeSelect.value;
    const animation = els.animationSelect.value;

    ws.send(JSON.stringify({
      type: 'goLive',
      payload: currentVerse,
      theme,
      animation,
      autoShowOverlay: obsConnected
    }));

    els.liveStatus.innerHTML = '<span class="live-indicator"><span class="live-dot"></span> LIVE</span>';
    setTimeout(() => {
      els.liveStatus.innerHTML = '';
    }, 3000);
  }

  // Hide overlay
  els.hideBtn.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'hideOverlay' }));
  });

  // Slide navigation
  els.nextSlideBtn.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'nextSlide' }));
  });

  els.prevSlideBtn.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'previousSlide' }));
  });

  // History
  function renderHistory() {
    if (history.length === 0) {
      els.history.innerHTML = '<div class="text-muted text-center" style="padding: var(--space-lg);">No history yet</div>';
      return;
    }

    els.history.innerHTML = history.slice().reverse().map(item => `
      <div class="history-item" data-ref="${escapeAttr(item.reference)}" data-translation="${escapeAttr(item.translationId)}">
        <div class="item-title">
          <span>${sanitizeHtmlBasicFormatting(item.reference)}</span>
          <span class="badge">${sanitizeHtmlBasicFormatting(item.translationName || item.translationId)}</span>
        </div>
        <div class="item-preview">${sanitizeHtmlBasicFormatting(item.preview)}</div>
      </div>
    `).join('');

    // Add click handlers
    els.history.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        els.refInput.value = el.dataset.ref;
        els.translationSelect.value = el.dataset.translation;
        fetchVerse();
      });
    });
  }

  els.clearHistoryBtn.addEventListener('click', async () => {
    if (!confirm('Clear all history?')) return;
    await fetch('/api/history', { method: 'DELETE' });
    history = [];
    renderHistory();
  });

  // Favorites
  function renderFavorites() {
    if (favorites.length === 0) {
      els.favorites.innerHTML = '<div class="text-muted text-center" style="padding: var(--space-lg);">No favorites yet</div>';
      return;
    }

    els.favorites.innerHTML = favorites.map(key => {
      const [ref, translation] = key.split(':');
      return `
        <div class="favorite-item" data-ref="${escapeAttr(ref)}" data-translation="${escapeAttr(translation)}">
          <div class="item-title">
            <span>${sanitizeHtmlBasicFormatting(ref)}</span>
            <div>
              <span class="badge">${sanitizeHtmlBasicFormatting(translation.toUpperCase())}</span>
              <button class="btn btn-sm btn-ghost" onclick="removeFavorite('${escapeAttr(key)}')">×</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    els.favorites.querySelectorAll('.favorite-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        els.refInput.value = el.dataset.ref;
        els.translationSelect.value = el.dataset.translation;
        fetchVerse();
      });
    });
  }

  els.addFavoriteBtn.addEventListener('click', async () => {
    if (!currentVerse) return;
    
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: currentVerse.reference,
        translation: currentVerse.translationId
      })
    });
  });

  window.removeFavorite = async (key) => {
    await fetch(`/api/favorites/${encodeURIComponent(key)}`, { method: 'DELETE' });
  };

  // Service Plan
  function renderServicePlan() {
    if (servicePlan.length === 0) {
      els.servicePlan.innerHTML = '<div class="text-muted text-center" style="padding: var(--space-lg);">No items in plan</div>';
      return;
    }

    els.servicePlan.innerHTML = servicePlan.map((item, index) => `
      <div class="plan-item" data-index="${index}">
        <div class="item-title">
          <span>${sanitizeHtmlBasicFormatting(item.reference)}</span>
          <div>
            <span class="badge">${sanitizeHtmlBasicFormatting(item.translationName || item.translationId)}</span>
            <button class="btn btn-sm btn-ghost" onclick="removePlanItem(${index})">×</button>
          </div>
        </div>
      </div>
    `).join('');

    els.servicePlan.querySelectorAll('.plan-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const index = parseInt(el.dataset.index);
        currentVerse = servicePlan[index];
        renderPreview(currentVerse);
        els.goLiveBtn.disabled = false;
      });
    });
  }

  els.addToPlanBtn.addEventListener('click', async () => {
    if (!currentVerse) return;
    
    servicePlan.push(currentVerse);
    await fetch('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: servicePlan })
    });
  });

  els.clearPlanBtn.addEventListener('click', async () => {
    if (!confirm('Clear service plan?')) return;
    servicePlan = [];
    await fetch('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: [] })
    });
  });

  window.removePlanItem = async (index) => {
    servicePlan.splice(index, 1);
    await fetch('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: servicePlan })
    });
  };

  // OBS Integration
  els.obsConnectBtn.addEventListener('click', async () => {
    els.obsConnectBtn.disabled = true;
    els.obsConnectBtn.innerHTML = '<span>Connecting...</span>';

    try {
      const response = await fetch('/api/obs/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: els.obsUrl.value,
          password: els.obsPassword.value
        })
      });

      const json = await response.json();
      
      if (json.ok) {
        obsConnected = json.connected;
        alert('✓ Connected to OBS');
      } else {
        alert('✗ Failed to connect: ' + (json.error || 'Unknown error'));
      }
    } catch (error) {
      alert('✗ Error: ' + String(error));
    } finally {
      els.obsConnectBtn.disabled = false;
      els.obsConnectBtn.innerHTML = '<span>Connect to OBS</span>';
      updateConnectionStatus();
    }
  });

  els.obsEnsureBtn.addEventListener('click', async () => {
    els.obsEnsureBtn.disabled = true;
    els.obsEnsureBtn.innerHTML = '<span>Setting up...</span>';

    try {
      const theme = els.themeSelect.value;
      const response = await fetch('/api/obs/ensure-overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });

      const json = await response.json();
      
      if (json.ok) {
        const count = json.created?.length || 0;
        alert(`✓ Overlay ready in all scenes${count > 0 ? ` (${count} created)` : ''}`);
      } else {
        alert('✗ Failed: ' + (json.error || 'Unknown error'));
      }
    } catch (error) {
      alert('✗ Error: ' + String(error));
    } finally {
      els.obsEnsureBtn.disabled = false;
      els.obsEnsureBtn.innerHTML = '<span>Setup Overlay in All Scenes</span>';
    }
  });

  // QR Code for remote
  async function loadQRCode() {
    try {
      const response = await fetch('/api/qr');
      const json = await response.json();
      
      if (json.ok) {
        els.qrCode.innerHTML = `<img src="${json.qr}" alt="QR Code" style="width: 200px; height: 200px;">`;
        els.remoteUrl.textContent = json.url;
      }
    } catch (error) {
      console.error('[Control] QR Code error:', error);
    }
  }

  if (els.enableDrawingBtn) {
    els.enableDrawingBtn.addEventListener('click', () => {
      ws.send(JSON.stringify({ type: 'enableDrawing' }));
    });
  }

  if (els.disableDrawingBtn) {
    els.disableDrawingBtn.addEventListener('click', () => {
      ws.send(JSON.stringify({ type: 'disableDrawing' }));
    });
  }

  if (els.clearDrawingBtn) {
    els.clearDrawingBtn.addEventListener('click', () => {
      ws.send(JSON.stringify({ type: 'clearDrawing' }));
    });
  }

  const remoteColorButtons = document.querySelectorAll('[data-remote-color]');
  if (remoteColorButtons.length) {
    remoteColorButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        ws.send(JSON.stringify({
          type: 'setDrawColor',
          color: btn.dataset.remoteColor
        }));
      });
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === 'Enter') {
      if (currentVerse) goLive();
    } else if (e.key === 'Escape') {
      ws.send(JSON.stringify({ type: 'hideOverlay' }));
    } else if (e.key === 'ArrowRight') {
      ws.send(JSON.stringify({ type: 'nextSlide' }));
    } else if (e.key === 'ArrowLeft') {
      ws.send(JSON.stringify({ type: 'previousSlide' }));
    }
  });

  // Utilities
  function sanitizeHtmlBasicFormatting(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    let html = div.innerHTML;
    html = html.replace(/&lt;(\/?)(i)&gt;/gi, '<$1i>')
               .replace(/&lt;(\/?)(strong)&gt;/gi, '<$1strong>')
               .replace(/&lt;(\/?)(b)&gt;/gi, '<$1b>')
               .replace(/&lt;(\/?)(u)&gt;/gi, '<$1u>');
    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return (text || '').replace(/"/g, '&quot;');
  }

  function renderAll() {
    renderHistory();
    renderFavorites();
    renderServicePlan();
    updateConnectionStatus();
  }

  // Initialize
  loadQRCode();
  updateConnectionStatus();
  
  console.log('[Control] Ready v2.1');
})();