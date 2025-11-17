import fs from 'fs';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';
import OBSWebSocket from 'obs-websocket-js';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, 'config.json');
let cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// PrimeBible-style config (same behavior as your Discord bot)
const PRIMEBIBLE_API_URL = process.env.PRIMEBIBLE_API_URL || 'https://primebible.com/api/verse-preview';
const ENABLE_BIBLEAPI_FALLBACK = process.env.PRIMEBIBLE_ENABLE_BIBLEAPI_FALLBACK !== '0';
const ALLOWED_TRANSLATIONS = (process.env.PRIMEBIBLE_ALLOWED_TRANSLATIONS || 'KJV,AKJV,WEB,ASV')
  .split(',')
  .map(s => s.trim().toUpperCase())
  .filter(Boolean);
if (ALLOWED_TRANSLATIONS.length === 0) ALLOWED_TRANSLATIONS.push('KJV');
if (ALLOWED_TRANSLATIONS.length > 25) {
  console.warn('[Config] PRIMEBIBLE_ALLOWED_TRANSLATIONS has more than 25 items:', ALLOWED_TRANSLATIONS.length);
}

// Friendly names and metadata, same shape as your bot
const TRANSLATION_INFO = {
  'KJV': { name: 'King James Version', year: '1611', style: 'Traditional' },
  'AKJV': { name: 'American King James Version', year: '1999', style: 'Updated Traditional' },
  'WEB': { name: 'World English Bible', year: '2000', style: 'Modern' },
  'ASV': { name: 'American Standard Version', year: '1901', style: 'Literal' },
  'ESV': { name: 'English Standard Version', year: '2001', style: 'Literal' },
  'NASB': { name: 'New American Standard Bible', year: '1971', style: 'Literal' },
  'YLT': { name: 'Young\'s Literal Translation', year: '1898', style: 'Very Literal' }
};

// Normalize and enforce translation to match Discord bot gating
function resolveTranslation(input) {
  const t = String(input || '').trim().toUpperCase();
  if (ALLOWED_TRANSLATIONS.includes(t)) return t;
  const cfgDefault = String(cfg.defaultTranslation || '').trim().toUpperCase();
  if (ALLOWED_TRANSLATIONS.includes(cfgDefault)) return cfgDefault;
  return ALLOWED_TRANSLATIONS[0];
}

// Keep UI in sync with env-driven translations
cfg.supportedTranslations = [...ALLOWED_TRANSLATIONS];
cfg.defaultTranslation = resolveTranslation(cfg.defaultTranslation);

// Persistence paths
const dataDir = path.join(__dirname, 'data');
const historyPath = path.join(dataDir, 'history.json');
const favoritesPath = path.join(dataDir, 'favorites.json');
const servicePlanPath = path.join(dataDir, 'service-plan.json');
const searchIndexPath = path.join(dataDir, 'search-index.json');
const customizationsPath = path.join(dataDir, 'customizations.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load persisted data
function loadJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn(`[Persistence] Failed to load ${filePath}:`, e.message);
  }
  return defaultValue;
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Persistence] Failed to save ${filePath}:`, e.message);
  }
}

// In-memory stores with persistence
const verseCache = new Map();
const history = loadJSON(historyPath, []);
const favorites = new Set(loadJSON(favoritesPath, []));
const servicePlan = loadJSON(servicePlanPath, []);
const searchIndex = loadJSON(searchIndexPath, []);

// Globals
const app = express();
const server = app.listen(cfg.port, () => {
  console.log(`
+====================================================================+
|                                                                    |
|         PrimeBible Pro for OBS                                     |
|                                                                    |
|  Server running on: http://localhost:${cfg.port}                       |
|  Control Dock:      http://localhost:${cfg.port}/control               |
|  Mobile Remote:     http://localhost:${cfg.port}/remote                |
|  Overlay:           http://localhost:${cfg.port}/overlay               |
|                                                                    |
|  Tip: Add control page as Custom Browser Dock in OBS               |
|                                                                    |
+====================================================================+
  `);
});

const wss = new WebSocketServer({ server });

// WebSocket rooms
const sockets = {
  overlay: new Set(),
  stage: new Set(),
  control: new Set(),
  remote: new Set()
};

let currentCustomizations = loadJSON(customizationsPath, {
  bgColor: '#000000',
  bgTransparency: 0.75,
  verseFont: 'poppins',
  referenceFont: 'montserrat',
  verseSize: 1,
  referenceSize: 1,
  solidBackground: false
});

function broadcast(kind, data) {
  const payload = JSON.stringify(data);
  const targets = kind === 'overlay' ? ['overlay', 'stage'] : [kind];
  for (const role of targets) {
    const set = sockets[role] || new Set();
    for (const ws of set) {
      try {
        ws.send(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

function broadcastToAll(data) {
  broadcast('overlay', data);
  broadcast('control', data);
  broadcast('remote', data);
}

function broadcastToOverlays(message) {
  broadcast('overlay', message);
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${cfg.port}`);
  const role = url.searchParams.get('role') || 'overlay';

  // PIN authentication for remote (if configured)
  if (role === 'remote' && cfg.remotePin) {
    const providedPin = url.searchParams.get('pin') || req.headers['x-remote-pin'];
    if (providedPin !== cfg.remotePin) {
      console.warn(`[WS] Remote connection rejected: invalid PIN`);
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid PIN' }));
      ws.close(4001, 'Invalid PIN');
      return;
    }
  }

  if (!sockets[role]) sockets[role] = new Set();
  sockets[role].add(ws);
  console.log(`[WS] ${role} connected (${sockets[role].size} total)`);

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg.toString('utf-8'));
      await handleClientMessage(role, ws, data);
    } catch (e) {
      console.error('[WS] Message error:', e);
      ws.send(JSON.stringify({ type: 'error', error: String(e) }));
    }
  });

  ws.on('close', () => {
    sockets[role].delete(ws);
    console.log(`[WS] ${role} disconnected`);
  });

  // Send initial state
  ws.send(JSON.stringify({
    type: 'hello',
    role,
    config: {
      defaultTheme: cfg.defaultTheme,
      defaultTranslation: cfg.defaultTranslation,
      defaultAnimation: cfg.defaultAnimation,
      themes: cfg.overlayThemes,
      animations: cfg.animations,
      translations: cfg.supportedTranslations
    },
    history: cfg.enableHistory ? history.slice(-20) : [],
    favorites: Array.from(favorites),
    servicePlan,
    customizations: currentCustomizations
  }));
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: {
      overlay: sockets.overlay.size,
      control: sockets.control.size,
      remote: sockets.remote.size
    },
    obsConnected
  });
});

// Generate QR code for remote access
app.get('/api/qr', async (req, res) => {
  try {
    const localIp = getLocalIp();
    const url = `http://${localIp}:${cfg.port}/remote`;
    const qr = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#5aaefc', light: '#0b0b10' }
    });
    res.json({ ok: true, qr, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Verse API with caching (now uses PrimeBible like your Discord bot)
app.get('/api/verse', async (req, res) => {
  const ref = (req.query.ref || '').trim();
  const requestedTranslation = req.query.translation || cfg.defaultTranslation;

  if (!ref) {
    return res.status(400).json({ ok: false, error: 'Missing reference' });
  }

  const normalizedTranslation = resolveTranslation(requestedTranslation); // uppercase for API
  const cacheKey = `${ref}:${normalizedTranslation.toLowerCase()}`;

  // Check cache
  if (cfg.cacheVerses && verseCache.has(cacheKey)) {
    const cached = verseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < cfg.cacheDuration) {
      return res.json({ ok: true, data: cached.data, cached: true });
    }
  }

  try {
    const verse = await fetchVerse(ref, normalizedTranslation);

    // Cache it
    if (cfg.cacheVerses) {
      verseCache.set(cacheKey, { data: verse, timestamp: Date.now() });
    }

    // Add to history
    if (cfg.enableHistory) {
      addToHistory(verse);
    }

    res.json({ ok: true, data: verse, cached: false });
  } catch (e) {
    console.error('[API] Verse fetch error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// History management
app.get('/api/history', (req, res) => {
  res.json({ ok: true, history: history.slice(-50) });
});

app.delete('/api/history', (req, res) => {
  history.length = 0;
  saveJSON(historyPath, history);
  broadcastToAll({ type: 'historyCleared' });
  res.json({ ok: true });
});

// Favorites
app.get('/api/favorites', (req, res) => {
  res.json({ ok: true, favorites: Array.from(favorites) });
});

app.post('/api/favorites', (req, res) => {
  const { ref, translation } = req.body;
  const key = `${ref}:${translation}`;
  favorites.add(key);
  saveJSON(favoritesPath, Array.from(favorites));
  broadcastToAll({ type: 'favoritesUpdated', favorites: Array.from(favorites) });
  res.json({ ok: true });
});

app.delete('/api/favorites/:key', (req, res) => {
  favorites.delete(req.params.key);
  saveJSON(favoritesPath, Array.from(favorites));
  broadcastToAll({ type: 'favoritesUpdated', favorites: Array.from(favorites) });
  res.json({ ok: true });
});

// Service plan
app.get('/api/service-plan', (req, res) => {
  res.json({ ok: true, plan: servicePlan });
});

app.post('/api/service-plan', (req, res) => {
  servicePlan.length = 0;
  servicePlan.push(...(req.body.plan || []));
  saveJSON(servicePlanPath, servicePlan);
  broadcastToAll({ type: 'servicePlanUpdated', plan: servicePlan });
  res.json({ ok: true });
});

// Service plan import (JSON)
app.post('/api/service-plan/import/json', (req, res) => {
  try {
    const imported = req.body.plan || [];
    servicePlan.length = 0;
    servicePlan.push(...imported);
    saveJSON(servicePlanPath, servicePlan);
    broadcastToAll({ type: 'servicePlanUpdated', plan: servicePlan });
    res.json({ ok: true, count: servicePlan.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Service plan import (CSV)
app.post('/api/service-plan/import/csv', express.text(), async (req, res) => {
  try {
    const lines = req.body.split('\n').filter(l => l.trim());
    const imported = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2) continue;

      const [ref, translation, theme, notes] = parts;

      // Fetch the verse
      try {
        const verse = await fetchVerse(ref, resolveTranslation(translation || cfg.defaultTranslation));
        if (notes) verse.notes = notes;
        if (theme) verse.theme = theme;
        imported.push(verse);
      } catch (e) {
        console.warn(`[Import] Failed to fetch ${ref}:`, e.message);
      }
    }

    servicePlan.length = 0;
    servicePlan.push(...imported);
    saveJSON(servicePlanPath, servicePlan);
    broadcastToAll({ type: 'servicePlanUpdated', plan: servicePlan });
    res.json({ ok: true, count: servicePlan.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Service plan export
app.get('/api/service-plan/export/json', (req, res) => {
  res.json({ ok: true, plan: servicePlan });
});

app.get('/api/service-plan/export/csv', (req, res) => {
  const csv = ['Reference,Translation,Theme,Notes'];
  servicePlan.forEach(item => {
    csv.push([
      item.reference,
      item.translationId,
      item.theme || '',
      item.notes || ''
    ].map(v => `"${v}"`).join(','));
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="service-plan.csv"');
  res.send(csv.join('\n'));
});

// Search verses (local search over recent items)
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const translation = resolveTranslation(req.query.translation || cfg.defaultTranslation).toLowerCase();

  if (!query || query.length < 2) {
    return res.status(400).json({ ok: false, error: 'Query too short (min 2 characters)' });
  }

  try {
    // Search in local index (history + favorites + service plan)
    const results = [];
    const seen = new Set();

    // Build search corpus from history, favorites, and service plan
    const corpus = [
      ...history.map(h => ({ ...h, source: 'history' })),
      ...Array.from(favorites).map(key => {
        const [ref, tr] = key.split(':');
        return { reference: ref, translationId: tr, source: 'favorite' };
        // translationName may be missing for favorites-only items
      }),
      ...servicePlan.map(p => ({ ...p, source: 'plan' }))
    ];

    // Search through corpus
    for (const item of corpus) {
      const ref = (item.reference || '').toLowerCase();
      const text = (item.preview || item.fullText || '').toLowerCase();
      const key = `${item.reference}:${item.translationId}`;

      if (seen.has(key)) continue;

      if (ref.includes(query) || text.includes(query)) {
        results.push({
          reference: item.reference,
          translationId: item.translationId,
          translationName: item.translationName,
          preview: item.preview || (item.fullText || '').substring(0, 100),
          source: item.source
        });
        seen.add(key);

        if (results.length >= 20) break;
      }
    }

    // Also add to search index for future searches
    updateSearchIndex(query, results);

    res.json({ ok: true, results, count: results.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

function updateSearchIndex(query, results) {
  // Keep last 100 search queries in index
  searchIndex.unshift({ query, results, timestamp: Date.now() });
  if (searchIndex.length > 100) {
    searchIndex.length = 100;
  }
  saveJSON(searchIndexPath, searchIndex);
}

// OBS WebSocket integration
const obs = new OBSWebSocket();
let obsConnected = false;
let obsReconnectTimer = null;
let obsReconnectAttempts = 0;
const MAX_OBS_RECONNECT_ATTEMPTS = 10;

async function connectObs() {
  if (obsConnected) return true;
  try {
    console.log(`[OBS] Connecting to ${cfg.obsWebsocketUrl}...`);
    await obs.connect(cfg.obsWebsocketUrl, cfg.obsPassword);
    obsConnected = true;
    obsReconnectAttempts = 0;
    console.log('[OBS] Connected');
    broadcastToAll({ type: 'obsStatusChanged', connected: true });

    // Auto-ensure overlay if configured
    if (cfg.autoCreateOverlayInAllScenes) {
      try {
        const overlayUrl = `http://127.0.0.1:${cfg.port}/overlay.html?theme=${encodeURIComponent(cfg.defaultTheme)}`;
        const created = await ensureOverlayInAllScenes(cfg.overlaySourceName, overlayUrl);
        console.log(`[OBS] Auto-ensured overlay in ${created.length} scenes`);
      } catch (e) {
        console.warn('[OBS] Auto-ensure overlay failed:', e.message);
      }
    }

    return true;
  } catch (e) {
    console.warn('[OBS] Connection failed:', String(e));
    obsConnected = false;
    scheduleObsReconnect();
    return false;
  }
}

function scheduleObsReconnect() {
  if (obsReconnectTimer || !cfg.connectToObsOnStart) return;
  if (obsReconnectAttempts >= MAX_OBS_RECONNECT_ATTEMPTS) {
    console.warn('[OBS] Max reconnect attempts reached. Giving up.');
    return;
  }

  const delay = Math.min(5000 * Math.pow(2, obsReconnectAttempts), 60000); // Exponential backoff, max 60s
  obsReconnectAttempts++;

  console.log(`[OBS] Reconnecting in ${delay}ms (attempt ${obsReconnectAttempts}/${MAX_OBS_RECONNECT_ATTEMPTS})`);

  obsReconnectTimer = setTimeout(() => {
    obsReconnectTimer = null;
    connectObs();
  }, delay);
}

obs.on('ConnectionClosed', () => {
  obsConnected = false;
  console.warn('[OBS] Connection closed');
  broadcastToAll({ type: 'obsStatusChanged', connected: false });
  scheduleObsReconnect();
});

obs.on('ConnectionError', (err) => {
  console.error('[OBS] Connection error:', err?.message || String(err));
  obsConnected = false;
  scheduleObsReconnect();
});

if (cfg.connectToObsOnStart) {
  setTimeout(() => connectObs(), 1000);
}

app.post('/api/obs/connect', async (req, res) => {
  if (req.body?.url) cfg.obsWebsocketUrl = req.body.url;
  if (req.body?.password) cfg.obsPassword = req.body.password;
  const success = await connectObs();
  res.json({ ok: success, connected: obsConnected });
});

app.post('/api/obs/ensure-overlay', async (req, res) => {
  try {
    if (!await connectObs()) {
      return res.status(500).json({ ok: false, error: 'OBS not connected' });
    }

    const theme = req.body?.theme || cfg.defaultTheme;
    const overlayUrl = `http://127.0.0.1:${cfg.port}/overlay.html?theme=${encodeURIComponent(theme)}`;
    const sourceName = req.body?.sourceName || cfg.overlaySourceName;

    const created = await ensureOverlayInAllScenes(sourceName, overlayUrl);
    res.json({ ok: true, created });
  } catch (e) {
    console.error('[OBS] Ensure overlay error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post('/api/obs/overlay-visible', async (req, res) => {
  try {
    if (!await connectObs()) {
      return res.status(500).json({ ok: false, error: 'OBS not connected' });
    }

    const visible = !!req.body.visible;
    const sourceName = req.body?.sourceName || cfg.overlaySourceName;
    await setOverlayVisibleInProgram(sourceName, visible);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

async function ensureOverlayInAllScenes(sourceName, url) {
  const { scenes } = await obs.call('GetSceneList');
  const created = [];

  for (const scene of scenes) {
    const sceneName = scene.sceneName;

    try {
      await obs.call('GetSceneItemId', { sceneName, sourceName });
      // Exists, update URL
      await obs.call('SetInputSettings', {
        inputName: sourceName,
        inputSettings: { url },
        overlay: true
      });
    } catch {
      // Does not exist, create it
      const result = await obs.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'browser_source',
        inputSettings: {
          url,
          width: 1920,
          height: 1080,
          css: 'body { margin: 0; overflow: hidden; }',
          shutdown: true,
          fps_custom: true,
          fps: 30
        },
        sceneItemEnabled: false
      });
      created.push({ sceneName, inputUuid: result.inputUuid });
    }
  }

  return created;
}

async function setOverlayVisibleInProgram(sourceName, visible) {
  const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
  const { sceneItemId } = await obs.call('GetSceneItemId', {
    sceneName: currentProgramSceneName,
    sourceName
  });
  await obs.call('SetSceneItemEnabled', {
    sceneName: currentProgramSceneName,
    sceneItemId,
    sceneItemEnabled: visible
  });
}

// WebSocket message handler
async function handleClientMessage(role, ws, data) {
  switch (data.type) {
    case 'requestVerse': {
      const ref = (data.ref || '').trim();
      const translation = resolveTranslation(data.translation || cfg.defaultTranslation);
      try {
        const verse = await fetchVerse(ref, translation);
        if (cfg.enableHistory) addToHistory(verse);
        ws.send(JSON.stringify({ type: 'verseResult', ok: true, data: verse }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'verseResult', ok: false, error: String(e) }));
      }
      break;
    }

    case 'goLive': {
      broadcast('overlay', {
        type: 'displayVerse',
        payload: data.payload,
        theme: data.theme || cfg.defaultTheme,
        animation: data.animation || cfg.defaultAnimation
      });

      if (data.autoShowOverlay && obsConnected) {
        try {
          await setOverlayVisibleInProgram(cfg.overlaySourceName, true);
        } catch (e) {
          console.error('[OBS] Show overlay error:', e);
        }
      }
      break;
    }

    case 'hideOverlay': {
      broadcast('overlay', { type: 'hideVerse' });

      if (obsConnected) {
        try {
          await setOverlayVisibleInProgram(cfg.overlaySourceName, false);
        } catch (e) {
          console.error('[OBS] Hide overlay error:', e);
        }
      }
      break;
    }

    case 'setTheme': {
      broadcast('overlay', { type: 'setTheme', theme: data.theme });
      break;
    }

    case 'setAnimation': {
      broadcast('overlay', { type: 'setAnimation', animation: data.animation });
      break;
    }

    case 'nextSlide': {
      broadcast('overlay', { type: 'nextSlide' });
      break;
    }

    case 'previousSlide': {
      broadcast('overlay', { type: 'previousSlide' });
      break;
    }

    case 'setBackground': {
      if (typeof data.color === 'string') {
        currentCustomizations.bgColor = data.color;
      }
      if (typeof data.transparency === 'number') {
        currentCustomizations.bgTransparency = data.transparency;
      }
      if (typeof data.solidBackground === 'boolean') {
        currentCustomizations.solidBackground = data.solidBackground;
      }

      saveJSON(customizationsPath, currentCustomizations);

      broadcastToOverlays({
        type: 'setBackground',
        color: currentCustomizations.bgColor,
        transparency: currentCustomizations.bgTransparency,
        solidBackground: currentCustomizations.solidBackground
      });
      break;
    }

    case 'setFonts': {
      if (data.verseFont) currentCustomizations.verseFont = data.verseFont;
      if (data.referenceFont) currentCustomizations.referenceFont = data.referenceFont;

      saveJSON(customizationsPath, currentCustomizations);

      broadcastToOverlays({
        type: 'setFonts',
        verseFont: currentCustomizations.verseFont,
        referenceFont: currentCustomizations.referenceFont
      });
      break;
    }

    case 'setFontSizes': {
      if (typeof data.verseSize === 'number') {
        currentCustomizations.verseSize = data.verseSize;
      }
      if (typeof data.referenceSize === 'number') {
        currentCustomizations.referenceSize = data.referenceSize;
      }

      saveJSON(customizationsPath, currentCustomizations);

      broadcastToOverlays({
        type: 'setFontSizes',
        verseSize: currentCustomizations.verseSize,
        referenceSize: currentCustomizations.referenceSize
      });
      break;
    }

    case 'forceRefresh': {
      broadcastToOverlays({ type: 'forceRefresh' });
      break;
    }

    case 'ticker': {
      broadcast('overlay', {
        type: 'ticker',
        text: data.text || '',
        action: data.action || 'start',
        speed: data.speed || 30
      });
      break;
    }

    case 'drawing': {
      broadcastToOverlays({
        type: 'drawing',
        action: data.action,
        point: data.point,
        color: data.color,
        lineWidth: data.lineWidth,
        isEraser: data.isEraser,
        origin: data.origin
      });
      break;
    }

    case 'clearDrawing': {
      broadcastToOverlays({ type: 'clearDrawing' });
      break;
    }

    case 'enableDrawing': {
      broadcastToOverlays({ type: 'enableDrawing' });
      break;
    }

    case 'disableDrawing': {
      broadcastToOverlays({ type: 'disableDrawing' });
      break;
    }

    case 'setDrawColor': {
      broadcastToOverlays({ type: 'setDrawColor', color: data.color });
      break;
    }

    case 'getState': {
      ws.send(JSON.stringify({
        type: 'state',
        history: history.slice(-20),
        favorites: Array.from(favorites),
        servicePlan,
        obsConnected
      }));
      break;
    }
  }
}

// Verse fetcher: PrimeBible first (Discord-style), optional fallback to bible-api.com
async function fetchVerse(ref, translationCode) {
  const tr = resolveTranslation(translationCode); // uppercase
  const providers = [
    () => fetchFromPrimeBible(ref, tr),
    ...(ENABLE_BIBLEAPI_FALLBACK ? [() => fetchFromBibleApi(ref, tr)] : [])
  ];

  let lastError;

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) return result;
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  throw lastError || new Error('All providers failed');
}

// PrimeBible provider (matches your Discord bot flow)
async function fetchFromPrimeBible(ref, translation) {
  const urlObj = new URL(PRIMEBIBLE_API_URL);
  urlObj.searchParams.set('ref', ref);
  urlObj.searchParams.set('translation', translation);
  urlObj.searchParams.set('origin', 'obs');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(urlObj.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PrimeBible-OBS/2.0.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`primebible.com: ${response.status} ${text.substring(0, 120)}`);
    }

    const json = await response.json();
    return normalizePrimeBibleData(json, ref, translation, 'primebible.com');
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw e;
  }
}

// bible-api.com fallback (kept for resilience, can be disabled with PRIMEBIBLE_ENABLE_BIBLEAPI_FALLBACK=0)
async function fetchFromBibleApi(ref, translation) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${encodeURIComponent(String(translation).toLowerCase())}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`bible-api.com: ${response.status} ${text.substring(0, 100)}`);
    }

    const json = await response.json();
    return normalizeBibleApiData(json, ref, translation, 'bible-api.com');
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw e;
  }
}

// api.bible placeholder remains unimplemented
async function fetchFromApiDotBible(ref, translation) {
  throw new Error('Not implemented');
}

// Normalize PrimeBible response into overlay-friendly payload
function normalizePrimeBibleData(json, ref, translation, provider) {
  // Accept several possible shapes: { ok, data }, { result }, or a direct object
  const payload = (json && typeof json === 'object')
    ? (json.data || json.result || json)
    : {};

  // Translation id and name
  let translationId = String(
    payload.translationId ||
    payload.translation_id ||
    payload.translationCode ||
    (payload.translation && (payload.translation.id || payload.translation.code)) ||
    translation
  ).toUpperCase();

  if (!ALLOWED_TRANSLATIONS.includes(translationId)) {
    translationId = resolveTranslation(translation);
  }

  const tInfo = TRANSLATION_INFO[translationId];
  const translationName =
    payload.translationName ||
    (payload.translation && payload.translation.name) ||
    (tInfo ? tInfo.name : translationId);

  // Verse list or text
  let verses = [];
  if (Array.isArray(payload.verses) && payload.verses.length > 0) {
    verses = payload.verses.map(v => ({
      book: (v.book_name || v.book || v.bookName || '').toString(),
      chapter: Number(v.chapter || v.chapter_number || v.chapterNum || 0),
      verse: Number(v.verse || v.verse_number || v.verseNum || 0),
      text: String(v.text || '').trim()
    })).filter(v => v.text);
  } else if (payload.text) {
    verses = [{
      book: (payload.book_name || payload.book || payload.bookName || '').toString(),
      chapter: Number(payload.chapter || payload.chapter_number || payload.chapterNum || 0),
      verse: Number(payload.verse || payload.verse_number || payload.verseNum || 0),
      text: String(payload.text || '').trim()
    }];
  } else if (Array.isArray(payload.items)) {
    verses = payload.items.map(v => ({
      book: String(v.book || v.bookName || ''),
      chapter: Number(v.chapter || 0),
      verse: Number(v.verse || 0),
      text: String(v.text || '').trim()
    })).filter(v => v.text);
  }

  const fullText = verses.length > 0
    ? verses.map(v => v.verse ? `${v.verse} ${v.text}` : v.text).join(' ').replace(/\s+/g, ' ').trim()
    : String(payload.preview || payload.fullText || payload.text || '').replace(/\s+/g, ' ').trim();

  const slides = chunkTextIntoSlides(fullText, cfg.maxCharsPerSlide, cfg.maxLinesPerSlide);

  const result = {
    provider,
    reference: payload.reference || ref,
    translationId: translationId.toLowerCase(), // keep storage consistent with existing code
    translationName,
    verses,
    fullText,
    slides,
    fetchedAt: new Date().toISOString()
  };

  // Optional extras if present
  const urlField = payload.url || payload.shareUrl || payload.chapterUrl || payload.link;
  if (urlField) result.url = urlField;
  if (tInfo && !payload.translationName) {
    result.translationMeta = { year: tInfo.year, style: tInfo.style };
  } else if (payload.translationMeta) {
    result.translationMeta = payload.translationMeta;
  }

  return result;
}

// Normalize bible-api.com response
function normalizeBibleApiData(json, ref, translation, provider) {
  let verses = [];

  if (Array.isArray(json.verses)) {
    verses = json.verses.map(v => ({
      book: v.book_name || v.book || '',
      chapter: v.chapter || 0,
      verse: v.verse || 0,
      text: (v.text || '').trim()
    }));
  } else if (json.text) {
    verses = [{
      book: json.reference?.split(' ')[0] || '',
      chapter: 0,
      verse: 0,
      text: json.text.trim()
    }];
  }

  const fullText = verses.map(v =>
    v.verse ? `${v.verse} ${v.text}` : v.text
  ).join(' ').replace(/\s+/g, ' ').trim();

  const slides = chunkTextIntoSlides(fullText, cfg.maxCharsPerSlide, cfg.maxLinesPerSlide);

  // Try to map the translation name using Discord's metadata if possible
  const requestedUpper = String(translation || '').toUpperCase();
  const tInfo = TRANSLATION_INFO[requestedUpper];

  return {
    provider,
    reference: json.reference || ref,
    translationId: String(translation || '').toLowerCase(),
    translationName: json.translation_name || (tInfo ? tInfo.name : requestedUpper),
    verses,
    fullText,
    slides,
    fetchedAt: new Date().toISOString()
  };
}

function chunkTextIntoSlides(text, maxChars, maxLines) {
  // Split into sentences without using regex lookbehind (avoids syntax errors on older Node)
  const sentences = (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => s.trim());
  const slides = [];
  let currentSlide = '';

  for (const sentence of sentences) {
    const testSlide = currentSlide ? `${currentSlide} ${sentence}` : sentence;
    const denom = (maxChars && maxLines) ? (maxChars / maxLines) : Number.MAX_SAFE_INTEGER;
    const lines = Math.ceil(testSlide.length / denom);

    if (testSlide.length > maxChars || lines > maxLines) {
      if (currentSlide) slides.push(currentSlide);
      currentSlide = sentence;
    } else {
      currentSlide = testSlide;
    }
  }

  if (currentSlide) slides.push(currentSlide);

  return slides.length > 0 ? slides : [text];
}

function addToHistory(verse) {
  const entry = {
    reference: verse.reference,
    translationId: verse.translationId,
    translationName: verse.translationName,
    preview: verse.fullText.substring(0, 100) + (verse.fullText.length > 100 ? '...' : ''),
    fullText: verse.fullText,
    timestamp: new Date().toISOString()
  };

  history.unshift(entry);
  if (history.length > cfg.maxHistoryItems) {
    history.length = cfg.maxHistoryItems;
  }

  saveJSON(historyPath, history);
  broadcastToAll({ type: 'historyUpdated', history: history.slice(-20) });
}

// Static routes
app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/remote', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n[Server] Shutting down gracefully...');
  if (obsConnected) {
    try {
      obs.disconnect();
    } catch (err) {
      console.error('[OBS] Error during disconnect:', err);
    }
  }

  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});
