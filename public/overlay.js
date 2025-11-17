// public/overlay.js
(function() {
  'use strict';

  // Root and URL params
  const root = document.getElementById('root');
  const params = new URLSearchParams(location.search);

  // Theme/animation state
  let currentTheme = params.get('theme') || 'glass-lower';
  let currentAnimation = params.get('animation') || 'fade';
  let currentPayload = null;
  let currentSlideIndex = 0;
  let overlayElement = null;
  let autoAdvanceTimer = null;

  // Unique id to prevent echo on mirrored drawing
  const overlayInstanceId = Math.random().toString(36).slice(2);

  // Safe area and accessibility flags
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

  // Initial customizations from URL (optional)
  const initBgColor = params.get('bgColor') || '#000000';
  const initBgTransparency = ((params.get('bgTransparency') || '75') / 100);
  const initSolidBackground = params.get('solidBg') === 'true';
  const initVerseFont = params.get('verseFont') || 'poppins';
  const initReferenceFont = params.get('referenceFont') || 'montserrat';

  if (initBgColor !== '#000000' || initBgTransparency !== 0.75 || initSolidBackground) {
    applyBackgroundCustomization(initBgColor, initBgTransparency, initSolidBackground);
  }
  if (initVerseFont !== 'poppins' || initReferenceFont !== 'montserrat') {
    applyFontCustomization(initVerseFont, initReferenceFont);
  }

  // Detect OBS browser
  const isObs = typeof window.obsstudio !== 'undefined' || (navigator.userAgent || '').toLowerCase().includes('obs');

  // Drawing elements
  const drawingCanvas = document.getElementById('drawingCanvas');
  const drawingToolbar = document.getElementById('drawingToolbar');

  // Create a preview canvas for line outlines and selection highlights
  const previewCanvas = document.createElement('canvas');
  previewCanvas.id = 'previewCanvas';
  previewCanvas.className = 'drawing-canvas';
  previewCanvas.style.pointerEvents = 'none';
  previewCanvas.style.zIndex = '10001';
  drawingToolbar.parentNode.insertBefore(previewCanvas, drawingToolbar);

  // Ensure toolbar stays on top of preview
  drawingToolbar.style.zIndex = '10002';

  // 2D contexts
  let ctx = drawingCanvas.getContext('2d');
  let pctx = previewCanvas.getContext('2d');
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  // Drawing state - always enabled now (no toggle needed)
  let isPointerDown = false;
  let currentTool = 'line';   // 'line' | 'pen' | 'select'
  let currentDrawColor = '#ffff00'; // highlighter yellow default
  let currentLineWidth = 8;
  let lastFreehandPoint = null;

  // For line tool
  let lineStartCss = null;

  // Store all drawn objects for moving/selecting
  let drawnObjects = [];
  let selectedObject = null;
  let isDraggingObject = false;
  let dragStartPoint = null;

  // Remember per-origin last points for remote mirroring (freehand only)
  const remoteLastPointByOrigin = Object.create(null);

  // Make canvases crisp and full-viewport
  function resizeCanvases(preserve = true) {
    const wCss = root.clientWidth || window.innerWidth;
    const hCss = root.clientHeight || window.innerHeight;

    // Snapshot main canvas if asked
    let snapshot = null;
    if (preserve && drawingCanvas.width && drawingCanvas.height && drawnObjects.length > 0) {
      // Don't use image snapshot - we'll redraw from objects
      snapshot = true;
    }

    dpr = Math.max(1, window.devicePixelRatio || 1);

    // Size main canvas
    drawingCanvas.width = Math.round(wCss * dpr);
    drawingCanvas.height = Math.round(hCss * dpr);
    drawingCanvas.style.width = wCss + 'px';
    drawingCanvas.style.height = hCss + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Size preview canvas
    previewCanvas.width = Math.round(wCss * dpr);
    previewCanvas.height = Math.round(hCss * dpr);
    previewCanvas.style.width = wCss + 'px';
    previewCanvas.style.height = hCss + 'px';
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.lineCap = 'round';
    pctx.lineJoin = 'round';

    // Redraw all objects if we had any
    if (snapshot) {
      redrawCanvas();
    }
  }
  window.addEventListener('resize', () => resizeCanvases(true));
  resizeCanvases(false);

  // Convert coordinates
  function getCanvasPointFromClient(clientX, clientY) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    return { x, y };
  }

  // Alpha helper for highlighter yellow
  function alphaForColor(hex) {
    return (hex || '').toLowerCase() === '#ffff00' ? 0.35 : 1.0;
  }

  // Draw a single object to the main canvas
  function drawObject(obj) {
    ctx.save();
    ctx.globalAlpha = alphaForColor(obj.color);
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = Math.max(1, obj.lineWidth || 3);

    if (obj.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(obj.start.x, obj.start.y);
      ctx.lineTo(obj.end.x, obj.end.y);
      ctx.stroke();
    } else if (obj.type === 'stroke') {
      ctx.beginPath();
      if (obj.points.length > 0) {
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Erase object by removing it from the array
  function eraseObject(obj) {
    const index = drawnObjects.indexOf(obj);
    if (index > -1) {
      drawnObjects.splice(index, 1);
      redrawCanvas();
    }
  }

  // Redraw entire canvas from stored objects
  function redrawCanvas() {
    const rect = drawingCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawnObjects.forEach(obj => drawObject(obj));
  }

  // Draw a preview line on the preview canvas (clears previous preview)
  function drawPreviewLine(fromCss, toCss, color, lineWidth) {
    pctx.save();
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.clearRect(0, 0, previewCanvas.width / dpr, previewCanvas.height / dpr);
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = alphaForColor(color);
    pctx.strokeStyle = color;
    pctx.lineWidth = Math.max(1, Number(lineWidth || 3));
    pctx.setLineDash([8, 6]);
    pctx.beginPath();
    pctx.moveTo(fromCss.x, fromCss.y);
    pctx.lineTo(toCss.x, toCss.y);
    pctx.stroke();
    pctx.restore();
  }

  function clearPreview() {
    pctx.save();
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.clearRect(0, 0, previewCanvas.width / dpr, previewCanvas.height / dpr);
    pctx.restore();
  }

  function clearCanvas() {
    const rect = drawingCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    clearPreview();
    drawnObjects = [];
    selectedObject = null;
  }

  // Highlight selected object
  function highlightSelected() {
    clearPreview();
    if (!selectedObject) return;

    pctx.save();
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.strokeStyle = '#00ffff';
    pctx.lineWidth = Math.max(1, (selectedObject.lineWidth || 3) + 4);
    pctx.globalAlpha = 0.6;
    pctx.setLineDash([10, 5]);

    if (selectedObject.type === 'line') {
      pctx.beginPath();
      pctx.moveTo(selectedObject.start.x, selectedObject.start.y);
      pctx.lineTo(selectedObject.end.x, selectedObject.end.y);
      pctx.stroke();
    } else if (selectedObject.type === 'stroke') {
      pctx.beginPath();
      if (selectedObject.points.length > 0) {
        pctx.moveTo(selectedObject.points[0].x, selectedObject.points[0].y);
        for (let i = 1; i < selectedObject.points.length; i++) {
          pctx.lineTo(selectedObject.points[i].x, selectedObject.points[i].y);
        }
        pctx.stroke();
      }
    }
    pctx.restore();
  }

  // Find object near a point
  function findObjectNear(pt, threshold = 15) {
    for (let i = drawnObjects.length - 1; i >= 0; i--) {
      const obj = drawnObjects[i];
      if (obj.type === 'line') {
        if (distanceToLineSegment(pt, obj.start, obj.end) < threshold) {
          return obj;
        }
      } else if (obj.type === 'stroke') {
        for (let j = 0; j < obj.points.length - 1; j++) {
          if (distanceToLineSegment(pt, obj.points[j], obj.points[j + 1]) < threshold) {
            return obj;
          }
        }
      }
    }
    return null;
  }

  // Distance from point to line segment
  function distanceToLineSegment(pt, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(pt.x - a.x, pt.y - a.y);

    let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));

    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(pt.x - projX, pt.y - projY);
  }

  // Disable text selection while drawing
  let userSelectStyle = null;
  function setUserSelectLocked(locked) {
    if (locked) {
      if (!userSelectStyle) {
        userSelectStyle = document.createElement('style');
        userSelectStyle.id = 'user-select-lock';
        userSelectStyle.textContent =
          'html,body,.overlay-root{ -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; user-select:none; }';
        document.head.appendChild(userSelectStyle);
      }
    } else if (userSelectStyle) {
      userSelectStyle.remove();
      userSelectStyle = null;
    }
  }

  // Pointer handling
  drawingCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();

    const ptCss = getCanvasPointFromClient(e.clientX, e.clientY);

    // Select tool - find and select object
    if (currentTool === 'select') {
      const obj = findObjectNear(ptCss);
      if (obj) {
        selectedObject = obj;
        isDraggingObject = true;
        dragStartPoint = ptCss;
        highlightSelected();
        try { drawingCanvas.setPointerCapture(e.pointerId); } catch {}
      } else {
        selectedObject = null;
        clearPreview();
      }
      return;
    }

    // Pen tool
    if (currentTool === 'pen') {
      isPointerDown = true;
      lastFreehandPoint = ptCss;
      const newStroke = {
        type: 'stroke',
        points: [{ ...ptCss }],
        color: currentDrawColor,
        lineWidth: currentLineWidth
      };
      drawnObjects.push(newStroke);
      try { drawingCanvas.setPointerCapture(e.pointerId); } catch {}
      sendDrawEvent('begin', ptCss);
      return;
    }

    // Line tool
    if (currentTool === 'line') {
      isPointerDown = true;
      lineStartCss = ptCss;
      drawPreviewLine(lineStartCss, lineStartCss, currentDrawColor, currentLineWidth);
      try { drawingCanvas.setPointerCapture(e.pointerId); } catch {}
    }
  }, { passive: false });

  drawingCanvas.addEventListener('pointermove', (e) => {
    e.preventDefault();

    const ptCss = getCanvasPointFromClient(e.clientX, e.clientY);

    // Dragging selected object
    if (currentTool === 'select' && isDraggingObject && selectedObject && dragStartPoint) {
      const dx = ptCss.x - dragStartPoint.x;
      const dy = ptCss.y - dragStartPoint.y;
      dragStartPoint = ptCss;

      if (selectedObject.type === 'line') {
        selectedObject.start.x += dx;
        selectedObject.start.y += dy;
        selectedObject.end.x += dx;
        selectedObject.end.y += dy;
      } else if (selectedObject.type === 'stroke') {
        selectedObject.points.forEach(pt => {
          pt.x += dx;
          pt.y += dy;
        });
      }

      redrawCanvas();
      highlightSelected();
      return;
    }

    if (!isPointerDown) return;

    // Pen tool
    if (currentTool === 'pen') {
      const currentStroke = drawnObjects[drawnObjects.length - 1];
      if (currentStroke && currentStroke.type === 'stroke') {
        currentStroke.points.push({ ...ptCss });
        drawObject(currentStroke);
      }
      lastFreehandPoint = ptCss;
      sendDrawEvent('draw', ptCss);
      return;
    }

    // Line tool preview
    if (currentTool === 'line') {
      const endCss = ptCss;
      drawPreviewLine(lineStartCss, endCss, currentDrawColor, currentLineWidth);
    }
  }, { passive: false });

  function finishPointer(e) {
    e.preventDefault();

    if (currentTool === 'select' && isDraggingObject) {
      isDraggingObject = false;
      dragStartPoint = null;
      try { drawingCanvas.releasePointerCapture(e.pointerId); } catch {}
      return;
    }

    if (!isPointerDown) return;
    isPointerDown = false;
    try { drawingCanvas.releasePointerCapture(e.pointerId); } catch {}

    if (currentTool === 'pen') {
      sendDrawEvent('end', lastFreehandPoint);
      lastFreehandPoint = null;
      return;
    }

    // Finalize line
    if (currentTool === 'line') {
      const endCss = getCanvasPointFromClient(e.clientX, e.clientY);
      clearPreview();

      const newLine = {
        type: 'line',
        start: { ...lineStartCss },
        end: { ...endCss },
        color: currentDrawColor,
        lineWidth: currentLineWidth
      };
      drawnObjects.push(newLine);
      drawObject(newLine);

      // Broadcast the line
      sendLineEvent(lineStartCss, endCss);
      lineStartCss = null;
    }
  }

  drawingCanvas.addEventListener('pointerup', finishPointer, { passive: false });
  drawingCanvas.addEventListener('pointercancel', finishPointer, { passive: false });
  drawingCanvas.addEventListener('pointerleave', (e) => { if (isPointerDown || isDraggingObject) finishPointer(e); }, { passive: false });

  // WebSocket
  const wsUrl = `${location.origin.replace('http', 'ws')}/?role=overlay`;
  let ws = new WebSocket(wsUrl);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

  ws.addEventListener('open', () => { reconnectAttempts = 0; });
  ws.addEventListener('close', () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
      setTimeout(() => {
        reconnectAttempts++;
        ws = new WebSocket(wsUrl);
        setupWebSocket();
      }, delay);
    }
  });
  ws.addEventListener('error', () => {});
  ws.addEventListener('message', (event) => {
    try { handleMessage(JSON.parse(event.data)); } catch {}
  });

  function setupWebSocket() {
    ws.addEventListener('open', () => { reconnectAttempts = 0; });
    ws.addEventListener('close', () => {});
    ws.addEventListener('message', (event) => {
      try { handleMessage(JSON.parse(event.data)); } catch {}
    });
  }

  // Convert coordinates
  function toNormalized(cssPt) {
    const rect = drawingCanvas.getBoundingClientRect();
    return { x: rect.width ? cssPt.x / rect.width : 0, y: rect.height ? cssPt.y / rect.height : 0 };
  }
  function fromNormalized(npt) {
    const rect = drawingCanvas.getBoundingClientRect();
    return { x: npt.x * rect.width, y: npt.y * rect.height };
  }

  // Send freehand stroke points
  function sendDrawEvent(action, cssPt) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const payload = {
      type: 'drawing',
      action,
      point: cssPt ? toNormalized(cssPt) : undefined,
      color: currentDrawColor,
      lineWidth: currentLineWidth,
      origin: overlayInstanceId
    };
    try { ws.send(JSON.stringify(payload)); } catch {}
  }

  // Send a single line
  function sendLineEvent(startCss, endCss) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const payload = {
      type: 'drawing',
      action: 'line',
      start: toNormalized(startCss),
      end: toNormalized(endCss),
      color: currentDrawColor,
      lineWidth: currentLineWidth,
      origin: overlayInstanceId
    };
    try { ws.send(JSON.stringify(payload)); } catch {}
  }

  // Mirror remote strokes
  function handleRemoteDrawing(msg) {
    // Ignore our own events
    if (msg.origin && msg.origin === overlayInstanceId) return;

    if (msg.action === 'line') {
      if (!msg.start || !msg.end) return;
      const a = fromNormalized(msg.start);
      const b = fromNormalized(msg.end);
      const lw = typeof msg.lineWidth === 'number' ? msg.lineWidth : currentLineWidth;
      const newLine = {
        type: 'line',
        start: a,
        end: b,
        color: msg.color || currentDrawColor,
        lineWidth: lw
      };
      drawnObjects.push(newLine);
      drawObject(newLine);
      return;
    }

    const origin = msg.origin || 'remote';
    const lw = typeof msg.lineWidth === 'number' ? msg.lineWidth : currentLineWidth;
    const color = msg.color || currentDrawColor;

    if (msg.action === 'begin') {
      if (!msg.point) return;
      remoteLastPointByOrigin[origin] = fromNormalized(msg.point);
      return;
    }
    if (msg.action === 'draw') {
      if (!msg.point) return;
      const last = remoteLastPointByOrigin[origin] || fromNormalized(msg.point);
      const now = fromNormalized(msg.point);
      
      // Find or create remote stroke
      let remoteStroke = drawnObjects.find(o => o.type === 'stroke' && o.remoteOrigin === origin && !o.completed);
      if (!remoteStroke) {
        remoteStroke = {
          type: 'stroke',
          points: [last],
          color: color,
          lineWidth: lw,
          remoteOrigin: origin
        };
        drawnObjects.push(remoteStroke);
      }
      remoteStroke.points.push(now);
      drawObject(remoteStroke);
      remoteLastPointByOrigin[origin] = now;
      return;
    }
    if (msg.action === 'end') {
      const remoteStroke = drawnObjects.find(o => o.type === 'stroke' && o.remoteOrigin === origin && !o.completed);
      if (remoteStroke) {
        remoteStroke.completed = true;
        delete remoteStroke.remoteOrigin;
      }
      delete remoteLastPointByOrigin[origin];
    }
  }

  // Message handler
  function handleMessage(msg) {
    switch (msg.type) {
      case 'hello': {
        if (msg.config) {
          currentTheme = params.get('theme') || msg.config.defaultTheme || 'glass-lower';
          currentAnimation = params.get('animation') || msg.config.defaultAnimation || 'fade';
        }
        if (msg.customizations) {
          const c = msg.customizations;
          if (typeof c.bgTransparency === 'number') {
            applyBackgroundCustomization(c.bgColor || '#000000', c.bgTransparency, !!c.solidBackground);
          }
          if (c.verseFont || c.referenceFont) {
            applyFontCustomization(c.verseFont || 'poppins', c.referenceFont || 'montserrat');
          }
          if (typeof c.verseSize === 'number' || typeof c.referenceSize === 'number') {
            applyFontSizeCustomization(c.verseSize || 1, c.referenceSize || 1);
          }
        }
        break;
      }

      case 'displayVerse':
        if (msg.payload) displayVerse(msg.payload, msg.theme, msg.animation);
        break;

      case 'hideVerse':
        hideOverlay();
        break;

      case 'setTheme':
        if (msg.theme) {
          currentTheme = msg.theme;
          if (currentPayload) displayVerse(currentPayload, currentTheme, currentAnimation);
        }
        break;

      case 'setAnimation':
        if (msg.animation) currentAnimation = msg.animation;
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

      case 'setBackground':
        if (typeof msg.transparency !== 'undefined') {
          applyBackgroundCustomization(msg.color || '#000000', msg.transparency, !!msg.solidBackground);
        }
        break;

      case 'setFonts':
        applyFontCustomization(msg.verseFont || 'poppins', msg.referenceFont || 'montserrat');
        break;

      case 'setFontSizes':
        applyFontSizeCustomization(msg.verseSize || 1, msg.referenceSize || 1);
        break;

      case 'forceRefresh':
        window.location.reload();
        break;

      case 'clearDrawing':
        clearCanvas();
        break;

      case 'enableDrawing':
        drawingToolbar.style.display = '';
        drawingToolbar.classList.add('visible');
        // Don't auto-enable canvas - let user click a tool
        break;

      case 'disableDrawing':
        drawingToolbar.style.display = 'none';
        drawingToolbar.classList.remove('visible');
        drawingCanvas.classList.remove('active');
        setUserSelectLocked(false);
        break;

      case 'setDrawColor':
        if (msg.color) {
          setColor(msg.color);
        }
        break;

      case 'drawing':
        handleRemoteDrawing(msg);
        break;
    }
  }

  // Customization helpers
  function applyBackgroundCustomization(color, transparency, solidBackground) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const customBg = `rgba(${r}, ${g}, ${b}, ${transparency})`;
    document.documentElement.style.setProperty('--glass-bg', customBg);

    const style = document.getElementById('dynamic-bg-style') || document.createElement('style');
    style.id = 'dynamic-bg-style';

    if (solidBackground) {
      style.textContent =
        `.glass-lower-content{background:${customBg}!important;}
         .theme-full-screen{background:${customBg}!important;}
         .theme-split-side{background:${customBg}!important;}
         .corner-card-content{background:${customBg}!important;}
         .theme-ticker{background:${customBg}!important;}`;
    } else {
      const gradientLight = `rgba(${r}, ${g}, ${b}, ${transparency * 0.65})`;
      const gradientTransparent = `rgba(${r}, ${g}, ${b}, 0)`;
      style.textContent =
        `.glass-lower-content{background:linear-gradient(90deg,${customBg} 0%,${gradientLight} 50%,${gradientTransparent} 100%)!important;}
         .theme-full-screen{background:linear-gradient(135deg,${customBg} 0%,rgba(${r},${g},${b},${transparency * 0.95}) 100%)!important;}
         .theme-split-side{background:linear-gradient(90deg,${gradientTransparent} 0%,${customBg} 15%,${customBg} 100%)!important;}
         .corner-card-content{background:${customBg}!important;}
         .theme-ticker{background:linear-gradient(180deg,${gradientTransparent} 0%,${customBg} 100%)!important;}`;
    }
    if (!document.getElementById('dynamic-bg-style')) {
      document.head.appendChild(style);
    }
  }

  function applyFontCustomization(verseFont, referenceFont) {
    const fontMap = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      'poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'lora': '"Lora", Georgia, "Times New Roman", serif',
      'merriweather': '"Merriweather", Georgia, "Times New Roman", serif',
      'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'opensans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    };
    if (verseFont && fontMap[verseFont]) {
      document.documentElement.style.setProperty('--font-verse', fontMap[verseFont]);
    }
    if (referenceFont && fontMap[referenceFont]) {
      document.documentElement.style.setProperty('--font-reference', fontMap[referenceFont]);
    }
    // Nudge layout so OBS updates instantly
    document.body.style.display = 'none';
    document.body.offsetHeight;
    document.body.style.display = '';
  }

  function applyFontSizeCustomization(verseScale, referenceScale) {
    if (typeof verseScale === 'number' && verseScale > 0) {
      document.documentElement.style.setProperty('--font-xs', `clamp(${0.75 * verseScale}rem, ${1.2 * verseScale}vmin, ${1 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-sm', `clamp(${0.875 * verseScale}rem, ${1.5 * verseScale}vmin, ${1.25 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-base', `clamp(${1 * verseScale}rem, ${1.8 * verseScale}vmin, ${1.5 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-lg', `clamp(${1.25 * verseScale}rem, ${2.2 * verseScale}vmin, ${2 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-xl', `clamp(${1.5 * verseScale}rem, ${2.8 * verseScale}vmin, ${2.5 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-2xl', `clamp(${2 * verseScale}rem, ${3.5 * verseScale}vmin, ${3.5 * verseScale}rem)`);
      document.documentElement.style.setProperty('--font-3xl', `clamp(${2.5 * verseScale}rem, ${4.5 * verseScale}vmin, ${5 * verseScale}rem)`);
    }
    if (typeof referenceScale === 'number' && referenceScale > 0) {
      document.documentElement.style.setProperty('--font-ref-xs', `clamp(${0.75 * referenceScale}rem, ${1.2 * referenceScale}vmin, ${1 * referenceScale}rem)`);
      document.documentElement.style.setProperty('--font-ref-sm', `clamp(${0.875 * referenceScale}rem, ${1.5 * referenceScale}vmin, ${1.25 * referenceScale}rem)`);
      document.documentElement.style.setProperty('--font-ref-base', `clamp(${1 * referenceScale}rem, ${1.8 * referenceScale}vmin, ${1.5 * referenceScale}rem)`);
      document.documentElement.style.setProperty('--font-ref-lg', `clamp(${1.25 * referenceScale}rem, ${2.2 * referenceScale}vmin, ${2 * referenceScale}rem)`);
      document.documentElement.style.setProperty('--font-ref-xl', `clamp(${1.5 * referenceScale}rem, ${2.8 * referenceScale}vmin, ${2.5 * referenceScale}rem)`);
    }
  }

  // Overlay rendering
  function displayVerse(payload, theme, animation) {
    currentPayload = payload;
    currentSlideIndex = 0;
    if (theme) currentTheme = theme;
    if (animation) currentAnimation = animation;

    hideOverlay(true);
    setTimeout(() => {
      overlayElement = buildTheme(currentTheme, payload, 0);
      if (overlayElement) {
        overlayElement.classList.add(`anim-${currentAnimation}`);
        overlayElement.classList.add('overlay-hidden');
        root.appendChild(overlayElement);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlayElement.classList.remove('overlay-hidden');
          });
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
        }, 600);
      }
    }
  }

  function buildTheme(theme, payload, slideIndex) {
    const slides = payload.slides || [];
    const currentSlide = slides[slideIndex] || payload.fullText || '';
    const ref = payload.reference || '';
    const tr = payload.translationName || payload.translationId || '';

    switch (theme) {
      case 'glass-lower': return buildGlassLower(currentSlide, ref, tr, slideIndex, slides.length);
      case 'minimal-center': return buildMinimalCenter(currentSlide, ref, tr);
      case 'full-screen': return buildFullScreen(currentSlide, ref, tr, slideIndex, slides.length);
      case 'split-side': return buildSplitSide(currentSlide, ref, tr, slideIndex, slides.length);
      case 'corner-card': return buildCornerCard(currentSlide, ref, tr);
      case 'ticker': return buildTicker(payload.fullText || currentSlide);
      default: return buildGlassLower(currentSlide, ref, tr, slideIndex, slides.length);
    }
  }

  function buildGlassLower(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-glass-lower';
    el.innerHTML =
      `<div class="glass-lower-content">
         <div class="glass-lower-verse">${sanitizeHtmlBasicFormatting(verse)}</div>
         <div class="glass-lower-meta">
           <div class="glass-lower-ref">${sanitizeHtmlBasicFormatting(ref)}</div>
           <div class="glass-lower-tr">${sanitizeHtmlBasicFormatting(tr)}</div>
           ${total > 1 ? `<div class="glass-lower-slide-indicator">${index + 1} / ${total}</div>` : ''}
         </div>
       </div>`;
    return el;
  }

  function buildMinimalCenter(verse, ref, tr) {
    const el = document.createElement('div');
    el.className = 'theme-minimal-center';
    el.innerHTML =
      `<div class="minimal-center-content">
         <div class="minimal-center-verse">${sanitizeHtmlBasicFormatting(verse)}</div>
         <div class="minimal-center-meta">
           <span>${sanitizeHtmlBasicFormatting(ref)}</span>
           <span class="minimal-center-dot"></span>
           <span>${sanitizeHtmlBasicFormatting(tr)}</span>
         </div>
       </div>`;
    return el;
  }

  function buildFullScreen(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-full-screen';
    el.innerHTML =
      `<div class="full-screen-content">
         <div class="full-screen-verse">${sanitizeHtmlBasicFormatting(verse)}</div>
         <div class="full-screen-meta">
           <div class="full-screen-ref">${sanitizeHtmlBasicFormatting(ref)}</div>
           <div class="full-screen-tr">${sanitizeHtmlBasicFormatting(tr)}</div>
           ${total > 1 ? `<div class="full-screen-tr">${index + 1} of ${total}</div>` : ''}
         </div>
       </div>`;
    return el;
  }

  function buildSplitSide(verse, ref, tr, index, total) {
    const el = document.createElement('div');
    el.className = 'theme-split-side';
    el.innerHTML =
      `<div class="split-side-meta">
         <div class="split-side-ref">${sanitizeHtmlBasicFormatting(ref)}</div>
         <div class="split-side-tr">${sanitizeHtmlBasicFormatting(tr)} ${total > 1 ? `- ${index + 1}/${total}` : ''}</div>
       </div>
       <div class="split-side-verse">${sanitizeHtmlBasicFormatting(verse)}</div>`;
    return el;
  }

  function buildCornerCard(verse, ref, tr) {
    const el = document.createElement('div');
    el.className = 'theme-corner-card';
    el.innerHTML =
      `<div class="corner-card-content">
         <div class="corner-card-meta">
           <div class="corner-card-ref">${sanitizeHtmlBasicFormatting(ref)}</div>
           <div class="corner-card-tr">${sanitizeHtmlBasicFormatting(tr)}</div>
         </div>
         <div class="corner-card-verse">${sanitizeHtmlBasicFormatting(verse)}</div>
       </div>`;
    return el;
  }

  function buildTicker(text) {
    const el = document.createElement('div');
    el.className = 'theme-ticker';
    const repeated = `${text} | ${text} | ${text} | `;
    el.innerHTML = `<div class="ticker-track">${sanitizeHtmlBasicFormatting(repeated)}</div>`;
    return el;
  }

  // Slides
  function nextSlide() {
    if (!currentPayload || !currentPayload.slides) return;
    const slides = currentPayload.slides;
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
      transitionSlide();
    }
  }
  function previousSlide() {
    if (!currentPayload || !currentPayload.slides) return;
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      transitionSlide();
    }
  }
  function transitionSlide() {
    if (!overlayElement || !currentPayload) return;
    overlayElement.classList.add('overlay-hidden');
    setTimeout(() => {
      if (overlayElement) overlayElement.remove();
      overlayElement = buildTheme(currentTheme, currentPayload, currentSlideIndex);
      if (overlayElement) {
        overlayElement.classList.add(`anim-${currentAnimation}`);
        overlayElement.classList.add('overlay-hidden');
        root.appendChild(overlayElement);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlayElement.classList.remove('overlay-hidden');
          });
        });
      }
    }, 300);
  }
  function clearAutoAdvance() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  // Ticker
  function handleTicker(msg) {
    if (msg.action === 'start') {
      const payload = { fullText: msg.text, reference: '', translationName: '' };
      displayVerse(payload, 'ticker', 'fade');
    } else if (msg.action === 'stop') {
      hideOverlay();
    }
  }

  // Escaping
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

  // Keyboard shortcuts when testing in a browser
  if (window.self === window.top) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') previousSlide();
      if (e.key === 'Escape') hideOverlay();
      if (e.key === 'Delete' && selectedObject) {
        eraseObject(selectedObject);
        selectedObject = null;
        clearPreview();
      }
      // Toggle toolbar with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        if (drawingToolbar.style.display === 'none') {
          drawingToolbar.style.display = '';
          drawingToolbar.classList.add('visible');
        } else {
          drawingToolbar.style.display = 'none';
          drawingToolbar.classList.remove('visible');
          drawingCanvas.classList.remove('active');
          setUserSelectLocked(false);
        }
      }
    });
  }

  // Build toolbar UI
  let headerEl, closeBtn, toolRow, lineBtn, penBtn, selectBtn, clearBtn;
  let colorButtons = [];

  function buildToolbarUi() {
    // Header with title and close button
    headerEl = document.createElement('div');
    headerEl.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:move;';
    
    const title = document.createElement('div');
    title.textContent = 'Annotate';
    title.style.cssText = 'font-size:14px;font-weight:600;color:#fff;opacity:0.8;';
    
    closeBtn = document.createElement('button');
    closeBtn.className = 'drawing-btn';
    closeBtn.title = 'Close';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'width:32px;height:32px;line-height:30px;padding:0;font-size:18px;';

    headerEl.appendChild(title);
    headerEl.appendChild(closeBtn);
    drawingToolbar.insertBefore(headerEl, drawingToolbar.firstChild);

    // Tool row
    toolRow = document.createElement('div');
    toolRow.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;';

    lineBtn = document.createElement('button');
    lineBtn.className = 'drawing-btn active';
    lineBtn.title = 'Line tool';
    lineBtn.textContent = '📏';
    toolRow.appendChild(lineBtn);

    penBtn = document.createElement('button');
    penBtn.className = 'drawing-btn';
    penBtn.title = 'Pen tool';
    penBtn.textContent = '✏️';
    toolRow.appendChild(penBtn);

    selectBtn = document.createElement('button');
    selectBtn.className = 'drawing-btn';
    selectBtn.title = 'Select & Move';
    selectBtn.textContent = '↔️';
    toolRow.appendChild(selectBtn);

    clearBtn = document.createElement('button');
    clearBtn.className = 'drawing-btn';
    clearBtn.title = 'Clear All';
    clearBtn.textContent = '🗑️';
    toolRow.appendChild(clearBtn);

    drawingToolbar.insertBefore(toolRow, headerEl.nextSibling);

    // Colors (existing buttons in HTML)
    colorButtons = Array.from(drawingToolbar.querySelectorAll('.color-btn'));

    // Wire up actions
    lineBtn.addEventListener('click', () => {
      currentTool = 'line';
      lineBtn.classList.add('active');
      penBtn.classList.remove('active');
      selectBtn.classList.remove('active');
      currentLineWidth = 8;
      selectedObject = null;
      clearPreview();
      drawingCanvas.classList.add('active');
      drawingCanvas.style.cursor = 'crosshair';
      setUserSelectLocked(true);
    });

    penBtn.addEventListener('click', () => {
      currentTool = 'pen';
      penBtn.classList.add('active');
      lineBtn.classList.remove('active');
      selectBtn.classList.remove('active');
      currentLineWidth = 3;
      selectedObject = null;
      clearPreview();
      drawingCanvas.classList.add('active');
      drawingCanvas.style.cursor = 'crosshair';
      setUserSelectLocked(true);
    });

    selectBtn.addEventListener('click', () => {
      currentTool = 'select';
      selectBtn.classList.add('active');
      lineBtn.classList.remove('active');
      penBtn.classList.remove('active');
      drawingCanvas.classList.add('active');
      drawingCanvas.style.cursor = 'pointer';
      setUserSelectLocked(false);
    });

    clearBtn.addEventListener('click', () => {
      clearCanvas();
      try { ws.send(JSON.stringify({ type: 'clearDrawing' })); } catch {}
    });

    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setColor(btn.dataset.color || '#ffff00');
      });
    });

    // Close button hides toolbar and disables drawing
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drawingToolbar.style.display = 'none';
      drawingToolbar.classList.remove('visible');
      drawingCanvas.classList.remove('active');
      setUserSelectLocked(false);
      try { ws.send(JSON.stringify({ type: 'disableDrawing' })); } catch {}
    });

    // Default selections
    setColor('#ffff00');

    // Draggable toolbar
    makeToolbarDraggable();
    
    // Hide toolbar by default in OBS, show in browser
    if (isObs) {
      drawingToolbar.style.display = 'none';
    } else {
      drawingToolbar.classList.add('visible');
    }
  }

  function setColor(hex) {
    currentDrawColor = hex;
    colorButtons.forEach(b => b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === hex.toLowerCase()));
    try { ws.send(JSON.stringify({ type: 'setDrawColor', color: currentDrawColor })); } catch {}
  }

  function makeToolbarDraggable() {
    const saved = loadToolbarPos();
    if (saved) {
      applyToolbarPos(saved.left, saved.top);
    }

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    headerEl.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = drawingToolbar.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let left = startLeft + dx;
      let top = startTop + dy;

      // clamp to viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = drawingToolbar.offsetWidth;
      const h = drawingToolbar.offsetHeight;
      left = Math.max(0, Math.min(vw - w, left));
      top = Math.max(0, Math.min(vh - h, top));

      applyToolbarPos(left, top);
    });

    window.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      const rect = drawingToolbar.getBoundingClientRect();
      saveToolbarPos(rect.left, rect.top);
    });
  }

  function applyToolbarPos(left, top) {
    drawingToolbar.style.left = `${Math.round(left)}px`;
    drawingToolbar.style.top = `${Math.round(top)}px`;
    drawingToolbar.style.right = 'auto';
    drawingToolbar.style.bottom = 'auto';
    drawingToolbar.style.transform = 'none';
    drawingToolbar.style.position = 'fixed';
  }

  function saveToolbarPos(left, top) {
    try { localStorage.setItem('primebible-toolbar-pos', JSON.stringify({ left: Math.round(left), top: Math.round(top) })); } catch {}
  }
  
  function loadToolbarPos() {
    try {
      const raw = localStorage.getItem('primebible-toolbar-pos');
      if (!raw) return null;
      const pos = JSON.parse(raw);
      if (typeof pos.left === 'number' && typeof pos.top === 'number') return pos;
    } catch {}
    return null;
  }

  // Build UI now
  buildToolbarUi();

})();