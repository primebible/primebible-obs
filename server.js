import fs from 'fs';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';
import OBSWebSocket from 'obs-websocket-js';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, 'config.json');
let cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Persistence paths
const dataDir = path.join(__dirname, 'data');
const historyPath = path.join(dataDir, 'history.json');
const favoritesPath = path.join(dataDir, 'favorites.json');
const servicePlanPath = path.join(dataDir, 'service-plan.json');
const searchIndexPath = path.join(dataDir, 'search-index.json');

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
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ✨ PrimeBible Pro for OBS ✨                        ║
║                                                              ║
║  Server running on: http://localhost:${cfg.port}                 ║
║  Control Dock:      http://localhost:${cfg.port}/control         ║
║  Mobile Remote:     http://localhost:${cfg.port}/remote          ║
║  Overlay:           http://localhost:${cfg.port}/overlay         ║
║                                                              ║
║  💡 Tip: Add control page as Custom Browser Dock in OBS     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

const wss = new WebSocketServer({ server });

// WebSocket rooms
const sockets = {
  overlay: new Set(),
  stage: new Set(),
  control: new Set(),
  remote: new Set()};

function broadcast(kind, data) {
    const payload = JSON.stringify(data);
  const targets = kind === 'overlay' ? ['overlay', 'stage'] : [kind];
  for (const role of targets) {
    const set = sockets[role] || new Set();
    for (const ws of set) {
      try { ws.send(payload); } catch (e) { console.error(e); }
    }
  }
} catch (e) { console.error(e); }
  }
}

function broadcastToAll(data) {
  broadcast('overlay', data);
  broadcast('control', data);
  broadcast('remote', data);
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
    servicePlan
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
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Verse API with caching
app.get('/api/verse', async (req, res) => {
  const ref = (req.query.ref || '').trim();
  const translation = (req.query.translation || cfg.defaultTranslation).toLowerCase();
  
  if (!ref) {
    return res.status(400).json({ ok: false, error: 'Missing reference' });
  }

  const cacheKey = `${ref}:${translation}`;
  
  // Check cache
  if (cfg.cacheVerses && verseCache.has(cacheKey)) {
    const cached = verseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < cfg.cacheDuration) {
      return res.json({ ok: true, data: cached.data, cached: true });
    }
  }

  try {
    const verse = await fetchVerse(ref, translation);
    
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
        const verse = await fetchVerse(ref, translation || cfg.defaultTranslation);
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

// Search verses
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const translation = (req.query.translation || cfg.defaultTranslation).toLowerCase();
  
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
    console.log('[OBS] ✓ Connected');
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
  console.error('[OBS] Connection error:', err.message);
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
      // Doesn't exist, create it
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
      const translation = (data.translation || cfg.defaultTranslation).toLowerCase();
      
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

    case 'ticker': {
      broadcast('overlay', {
        type: 'ticker',
        text: data.text || '',
        action: data.action || 'start',
        speed: data.speed || 30
      });
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

// Verse fetcher with multiple providers
async function fetchVerse(ref, translation) {
  const providers = [
    () => fetchFromBibleApi(ref, translation),
    () => fetchFromApiDotBible(ref, translation)
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

async function fetchFromBibleApi(ref, translation) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${encodeURIComponent(translation)}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`bible-api.com: ${response.status} ${text.substring(0, 100)}`);
    }
    
    const json = await response.json();
    return normalizeVerseData(json, ref, translation, 'bible-api.com');
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw e;
  }
}

async function fetchFromApiDotBible(ref, translation) {
  // Alternative provider - implement as needed
  throw new Error('Not implemented');
}

function normalizeVerseData(json, ref, translation, provider) {
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

  return {
    provider,
    reference: json.reference || ref,
    translationId: translation.toLowerCase(),
    translationName: json.translation_name || translation.toUpperCase(),
    verses,
    fullText,
    slides,
    fetchedAt: new Date().toISOString()
  };
}

function chunkTextIntoSlides(text, maxChars, maxLines) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const slides = [];
  let currentSlide = '';

  for (const sentence of sentences) {
    const testSlide = currentSlide ? `${currentSlide} ${sentence}` : sentence;
    const lines = Math.ceil(testSlide.length / (maxChars / maxLines));

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
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  if (obsConnected) {
    obs.disconnect();
  }
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});
