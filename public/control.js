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

  // Optional PIN (remotePin in config.json). Accept it from the page URL
  // (?pin=1234), remember it, and prompt if the server rejects us.
  const urlPin = new URLSearchParams(location.search).get('pin');
  if (urlPin) localStorage.setItem('primebible-pin', urlPin);
  let pin = urlPin || localStorage.getItem('primebible-pin') || '';

  function buildWsUrl() {
    const base = `${location.origin.replace('http', 'ws')}/?role=control`;
    return pin ? `${base}&pin=${encodeURIComponent(pin)}` : base;
  }

  // WebSocket — retries forever with capped backoff
  let ws = null;
  let reconnectDelay = 1000;

  function connectWebSocket() {
    ws = new WebSocket(buildWsUrl());

    ws.addEventListener('open', () => {
      console.log('[Control] Connected');
      wsConnected = true;
      reconnectDelay = 1000;
      updateConnectionStatus();
    });

    ws.addEventListener('close', (event) => {
      console.log('[Control] Disconnected');
      wsConnected = false;
      updateConnectionStatus();

      if (event.code === 4001) {
        // Server requires a PIN (or ours is wrong). Note: prompt() is dead
        // inside an OBS custom browser dock — it returns null immediately —
        // so always leave a visible hint about the ?pin= URL workaround.
        const entered = prompt('This server requires a PIN. Enter the remote PIN:');
        if (entered !== null && entered.trim()) {
          pin = entered.trim();
          localStorage.setItem('primebible-pin', pin);
          connectWebSocket();
        } else {
          els.liveStatus.innerHTML = '<span style="color: var(--danger); font-weight: 600;">🔒 PIN required — open this page with ?pin=YOUR_PIN</span>';
          console.warn('[Control] PIN required. Open the page with ?pin=YOUR_PIN or reload to try again.');
        }
        return;
      }

      setTimeout(connectWebSocket, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
    });

    ws.addEventListener('error', () => {});

    ws.addEventListener('message', (event) => {
      try {
        handleMessage(JSON.parse(event.data));
      } catch (e) {
        console.error('[Control] Message error:', e);
      }
    });
  }

  // Send only when actually connected; returns whether the message went out
  // so callers can give honest feedback instead of a false "LIVE"/"Applied".
  function wsSend(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  // API fetch that carries the PIN for mutating endpoints
  function apiFetch(url, options = {}) {
    if (pin) {
      options.headers = { ...(options.headers || {}), 'x-remote-pin': pin };
    }
    return fetch(url, options);
  }

  // Mutating API call with honest failure handling: returns the parsed JSON
  // on success, null on any failure (401, network, server error) — so
  // callers never falsify local state after a failed request.
  async function apiCall(url, options = {}) {
    try {
      const res = await apiFetch(url, options);
      if (res.status === 401) {
        alert('This server requires a PIN for changes. Reload the page and enter the PIN, or open the page with ?pin=YOUR_PIN.');
        return null;
      }
      if (!res.ok) return null;
      return await res.json().catch(() => ({}));
    } catch {
      return null;
    }
  }

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
    let h = (hex || '').replace(/^#/, '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
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

    const sent = wsSend({
      type: 'setBackground',
      color: bgColor,
      transparency: alpha,
      solidBackground: solidBackground
    });

    // Visual feedback
    els.applyBgBtn.innerHTML = sent ? '<span>✓ Applied!</span>' : '<span>⚠️ Not connected</span>';
    setTimeout(() => {
      els.applyBgBtn.innerHTML = '<span>Apply Background</span>';
    }, 2000);
  });

  els.forceRefreshBtn.addEventListener('click', () => {
    // The reloaded overlay gets styling and the live verse replayed by the
    // server on reconnect, so a bare refresh is all that's needed.
    const sent = wsSend({ type: 'forceRefresh' });

    els.forceRefreshBtn.innerHTML = sent ? '<span>✓ Refreshed!</span>' : '<span>⚠️ Not connected</span>';
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

    const sent = wsSend({
      type: 'setFonts',
      verseFont: verseFont,
      referenceFont: referenceFont
    });

    // Visual feedback
    els.applyFontsBtn.innerHTML = sent ? '<span>✓ Applied!</span>' : '<span>⚠️ Not connected</span>';
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

    const sent = wsSend({
      type: 'setFontSizes',
      verseSize: verseFontSize / 100,
      referenceSize: referenceFontSize / 100
    });

    // Visual feedback
    els.applySizesBtn.innerHTML = sent ? '<span>✓ Applied!</span>' : '<span>⚠️ Not connected</span>';
    setTimeout(() => {
      els.applySizesBtn.innerHTML = '<span>Apply Font Sizes</span>';
    }, 2000);
  });

  // Initialize previews
  updateBgPreview();
  updateFontPreview();
  els.verseSizeValue.textContent = `${verseFontSize}%`;
  els.referenceSizeValue.textContent = `${referenceFontSize}%`;

  // Populate a <select> from the server's option list. On the first hello the
  // markup value is just a placeholder, so the server default wins; on
  // reconnects the user's current choice is preserved.
  let selectsInitialized = false;

  function populateSelect(select, options, preferred) {
    const previous = select.value;
    select.innerHTML = options.map(o =>
      `<option value="${escapeAttr(o.value)}">${escapeAttr(o.label)}</option>`
    ).join('');
    const values = options.map(o => o.value);
    if (selectsInitialized && values.includes(previous)) select.value = previous;
    else if (preferred && values.includes(preferred)) select.value = preferred;
    else if (values.includes(previous)) select.value = previous;
  }

  // Adopt the server-persisted overlay styling so opening a control tab
  // never clobbers what another operator tuned mid-stream.
  function adoptCustomizations(c) {
    if (!c) return;
    if (typeof c.bgColor === 'string') bgColor = c.bgColor;
    if (typeof c.bgTransparency === 'number') bgTransparency = Math.round(c.bgTransparency * 100);
    if (typeof c.solidBackground === 'boolean') solidBackground = c.solidBackground;
    if (typeof c.verseFont === 'string') verseFont = c.verseFont;
    if (typeof c.referenceFont === 'string') referenceFont = c.referenceFont;
    if (typeof c.verseSize === 'number') verseFontSize = Math.round(c.verseSize * 100);
    if (typeof c.referenceSize === 'number') referenceFontSize = Math.round(c.referenceSize * 100);

    els.bgColorPicker.value = bgColor;
    els.transparencySlider.value = bgTransparency;
    if (els.solidBgCheckbox) els.solidBgCheckbox.checked = solidBackground;
    els.verseFontSelect.value = verseFont;
    els.referenceFontSelect.value = referenceFont;
    els.verseSizeSlider.value = verseFontSize;
    els.referenceSizeSlider.value = referenceFontSize;
    els.verseSizeValue.textContent = `${verseFontSize}%`;
    els.referenceSizeValue.textContent = `${referenceFontSize}%`;
    updateBgPreview();
    updateFontPreview();

    // Keep localStorage in sync so the next page load doesn't flash stale UI
    localStorage.setItem('primebible-bg-color', bgColor);
    localStorage.setItem('primebible-bg-transparency', bgTransparency);
    localStorage.setItem('primebible-bg-solid', solidBackground ? 'true' : 'false');
    localStorage.setItem('primebible-verse-font', verseFont);
    localStorage.setItem('primebible-ref-font', referenceFont);
    localStorage.setItem('primebible-verse-size', verseFontSize);
    localStorage.setItem('primebible-ref-size', referenceFontSize);
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello':
        if (msg.history) history = msg.history;
        if (msg.favorites) favorites = msg.favorites;
        if (msg.servicePlan) servicePlan = msg.servicePlan;
        obsConnected = !!msg.obsConnected;
        if (msg.config) {
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
          if (Array.isArray(msg.config.animations) && msg.config.animations.length) {
            populateSelect(
              els.animationSelect,
              msg.config.animations.map(a => ({ value: a.id, label: a.name })),
              msg.config.defaultAnimation
            );
          }
          selectsInitialized = true;
        }
        adoptCustomizations(msg.customizations);
        // Surface what's already on air (e.g. after a mid-service page reload)
        if (msg.currentLive && msg.currentLive.payload) {
          els.liveStatus.innerHTML = `<span class="live-indicator"><span class="live-dot"></span> On air: ${sanitizeHtmlBasicFormatting(msg.currentLive.payload.reference || '')}</span>`;
        }
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

      case 'historyCleared':
        history = [];
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
      // apiFetch so the PIN header rides along — the server only records
      // history for authenticated fetches when a PIN is set
      const response = await apiFetch(`/api/verse?ref=${encodeURIComponent(ref)}&translation=${encodeURIComponent(translation)}`);
      const json = await response.json();

      if (json.ok) {
        currentVerse = json.data;
        renderPreview(currentVerse);
        els.goLiveBtn.disabled = false;
        els.addToPlanBtn.disabled = false;
        els.addFavoriteBtn.disabled = false;
      } else {
        showError(json.error || 'Failed to fetch verse');
        clearCurrentVerse();
      }
    } catch (error) {
      showError(String(error));
      clearCurrentVerse();
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

  // A failed fetch must not leave the previous verse armed behind an error
  // preview — Enter/Go Live would silently show stale content.
  function clearCurrentVerse() {
    currentVerse = null;
    els.goLiveBtn.disabled = true;
    els.addToPlanBtn.disabled = true;
    els.addFavoriteBtn.disabled = true;
  }

  // Go live
  els.goLiveBtn.addEventListener('click', goLive);

  function goLive() {
    if (!currentVerse) return;

    const theme = els.themeSelect.value;
    const animation = els.animationSelect.value;

    const sent = wsSend({
      type: 'goLive',
      payload: currentVerse,
      theme,
      animation,
      autoShowOverlay: obsConnected
    });

    els.liveStatus.innerHTML = sent
      ? '<span class="live-indicator"><span class="live-dot"></span> LIVE</span>'
      : '<span style="color: var(--danger); font-weight: 600;">⚠️ Not connected — nothing sent</span>';
    setTimeout(() => {
      els.liveStatus.innerHTML = '';
    }, 3000);
  }

  // Hide overlay
  els.hideBtn.addEventListener('click', () => {
    if (wsSend({ type: 'hideOverlay' })) {
      els.liveStatus.innerHTML = '';
    }
  });

  // Slide navigation
  els.nextSlideBtn.addEventListener('click', () => {
    wsSend({ type: 'nextSlide' });
  });

  els.prevSlideBtn.addEventListener('click', () => {
    wsSend({ type: 'previousSlide' });
  });

  // History (server sends newest-first; render in that order)
  function renderHistory() {
    if (history.length === 0) {
      els.history.innerHTML = '<div class="text-muted text-center" style="padding: var(--space-lg);">No history yet</div>';
      return;
    }

    els.history.innerHTML = history.map(item => `
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
    const ok = await apiCall('/api/history', { method: 'DELETE' });
    if (ok) {
      history = [];
      renderHistory();
    }
  });

  // Favorites
  function renderFavorites() {
    if (favorites.length === 0) {
      els.favorites.innerHTML = '<div class="text-muted text-center" style="padding: var(--space-lg);">No favorites yet</div>';
      return;
    }

    els.favorites.innerHTML = favorites.map(key => {
      // Keys are "<reference>:<translation>" and references contain colons
      // ("John 3:16:kjv"), so split on the LAST colon only.
      const sep = key.lastIndexOf(':');
      const ref = sep > 0 ? key.slice(0, sep) : key;
      const translation = sep > 0 ? key.slice(sep + 1) : '';
      return `
        <div class="favorite-item" data-key="${escapeAttr(key)}" data-ref="${escapeAttr(ref)}" data-translation="${escapeAttr(translation)}">
          <div class="item-title">
            <span>${sanitizeHtmlBasicFormatting(ref)}</span>
            <div>
              <span class="badge">${sanitizeHtmlBasicFormatting(translation.toUpperCase())}</span>
              <button class="btn btn-sm btn-ghost" title="Remove favorite">×</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    els.favorites.querySelectorAll('.favorite-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          removeFavorite(el.dataset.key);
          return;
        }
        els.refInput.value = el.dataset.ref;
        els.translationSelect.value = el.dataset.translation;
        fetchVerse();
      });
    });
  }

  els.addFavoriteBtn.addEventListener('click', async () => {
    if (!currentVerse) return;

    // On success the server broadcasts favoritesUpdated, which re-renders
    await apiCall('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: currentVerse.reference,
        translation: currentVerse.translationId
      })
    });
  });

  async function removeFavorite(key) {
    await apiCall(`/api/favorites/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }

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
            <button class="btn btn-sm btn-ghost" title="Remove from plan">×</button>
          </div>
        </div>
      </div>
    `).join('');

    els.servicePlan.querySelectorAll('.plan-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const index = parseInt(el.dataset.index);
        if (e.target.tagName === 'BUTTON') {
          removePlanItem(index);
          return;
        }
        currentVerse = servicePlan[index];
        renderPreview(currentVerse);
        els.goLiveBtn.disabled = false;
        els.addToPlanBtn.disabled = false;
        els.addFavoriteBtn.disabled = false;
      });
    });
  }

  els.addToPlanBtn.addEventListener('click', async () => {
    if (!currentVerse) return;

    servicePlan.push(currentVerse);
    const ok = await apiCall('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: servicePlan })
    });
    if (!ok) {
      // Roll back so a failed POST can't leave a phantom item that a later
      // successful save would silently persist
      servicePlan.pop();
      renderServicePlan();
    }
  });

  els.clearPlanBtn.addEventListener('click', async () => {
    if (!confirm('Clear service plan?')) return;
    const ok = await apiCall('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: [] })
    });
    if (ok) {
      servicePlan = [];
      renderServicePlan();
    }
  });

  async function removePlanItem(index) {
    const removed = servicePlan.splice(index, 1)[0];
    const ok = await apiCall('/api/service-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: servicePlan })
    });
    if (!ok && removed) {
      servicePlan.splice(index, 0, removed);
      renderServicePlan();
    }
  }

  // OBS Integration
  els.obsConnectBtn.addEventListener('click', async () => {
    els.obsConnectBtn.disabled = true;
    els.obsConnectBtn.innerHTML = '<span>Connecting...</span>';

    try {
      const response = await apiFetch('/api/obs/connect', {
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
      const response = await apiFetch('/api/obs/ensure-overlay', {
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
      wsSend({ type: 'enableDrawing' });
    });
  }

  if (els.disableDrawingBtn) {
    els.disableDrawingBtn.addEventListener('click', () => {
      wsSend({ type: 'disableDrawing' });
    });
  }

  if (els.clearDrawingBtn) {
    els.clearDrawingBtn.addEventListener('click', () => {
      wsSend({ type: 'clearDrawing' });
    });
  }

  const remoteColorButtons = document.querySelectorAll('[data-remote-color]');
  if (remoteColorButtons.length) {
    remoteColorButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        wsSend({
          type: 'setDrawColor',
          color: btn.dataset.remoteColor
        });
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
      // preventDefault stops a focused button from ALSO activating,
      // which would double-fire (e.g. re-fetch after "Fetch Verse")
      e.preventDefault();
      if (currentVerse) goLive();
    } else if (e.key === 'Escape') {
      if (wsSend({ type: 'hideOverlay' })) {
        els.liveStatus.innerHTML = '';
      }
    } else if (e.key === 'ArrowRight') {
      wsSend({ type: 'nextSlide' });
    } else if (e.key === 'ArrowLeft') {
      wsSend({ type: 'previousSlide' });
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

  function escapeAttr(text) {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderAll() {
    renderHistory();
    renderFavorites();
    renderServicePlan();
    updateConnectionStatus();
  }

  // Initialize
  connectWebSocket();
  loadQRCode();
  updateConnectionStatus();

  console.log('[Control] Ready v2.2');
})();