# 🌟 PrimeBible Pro for OBS

**The ultimate Bible overlay system for OBS Studio** - State-of-the-art design, professional features, zero compromises. Everything free, forever.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

---

## ✨ Features That Set Us Apart

### 🎨 **Stunning Visual Themes**
- **Glass Lower Third** - Modern glassmorphic design with blur effects
- **Minimal Center** - Clean, distraction-free centered display
- **Full Screen** - Maximum readability for large venues
- **Split Side** - Professional side panel layout
- **Corner Card** - Compact, unobtrusive display
- **Scrolling Ticker** - News-style animated text

### ⚡ **Professional Power Features**
- **Multi-slide presentations** with automatic text chunking
- **Keyboard shortcuts** for lightning-fast operation
- **Service planning** - Pre-load your entire service order
- **History tracking** - Never lose a verse you've displayed
- **Favorites system** - Quick access to commonly used verses
- **Real-time preview** - See exactly what will appear on stream
- **OBS WebSocket integration** - Full automation and control

### 🎬 **Smooth Animations**
- Fade
- Slide (up, down, left, right)
- Zoom
- Instant (no animation)

### 📱 **Mobile Remote Control**
- **Beautiful mobile interface** optimized for phones and tablets
- **QR code access** for instant connection
- **Touch-optimized controls** with haptic feedback
- **Quick reference buttons** for common verses
- Works on any device with a browser

### 🌍 **Multi-Translation Support**
Built-in support for:
- KJV, NIV, ESV, NLT, NASB, AMP, MSG
- WEB, ASV, YLT, Almeida, RVR09, BGT
- And more!

---

## 🚀 Quick Start

### 1. Install Dependencies

**Prerequisites:**
- Node.js 18+ ([Download here](https://nodejs.org))
- OBS Studio 28+ ([Download here](https://obsproject.com))
- OBS WebSocket plugin enabled (built-in with OBS 28+)

**Installation:**
```bash
cd primebible-obs
npm install
```

### 2. Start the Server

```bash
npm start
```

You'll see:
```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ✨ PrimeBible Pro for OBS ✨                        ║
║                                                              ║
║  Server running on: http://localhost:4456                   ║
║  Control Dock:      http://localhost:4456/control           ║
║  Mobile Remote:     http://localhost:4456/remote            ║
║  Overlay:           http://localhost:4456/overlay           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 3. Set Up OBS

#### Enable WebSocket (if not already enabled)
1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Check **Enable WebSocket Server**
4. Note the port (default: 4455) and password
5. Click **OK**

#### Add Control Dock (Recommended)
1. In OBS, go to **View → Docks → Custom Browser Docks**
2. Add a new dock:
   - **Dock Name:** PrimeBible Control
   - **URL:** `http://localhost:4456/control`
3. Click **Apply**

Now you have a built-in control panel right inside OBS! 🎉

### 4. Connect OBS to PrimeBible

In the Control interface:
1. Go to the **OBS Integration** section
2. Verify the WebSocket URL is `ws://127.0.0.1:4455`
3. Enter your password (if you set one)
4. Click **Connect to OBS**
5. Once connected, click **Setup Overlay in All Scenes**

This creates a Browser Source named "PrimeBible Overlay" in all your scenes.

---

## 📖 How to Use

### Basic Workflow

1. **Enter a reference** in the Control panel (e.g., "John 3:16")
2. **Select translation and theme**
3. Click **Fetch Verse**
4. **Preview** the verse in the preview panel
5. Click **Go Live** to display it on stream
6. Click **Hide** when done

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Go Live (when control panel has focus) |
| `Esc` | Hide overlay |
| `←` | Previous slide |
| `→` | Next slide |

### Service Planning

1. Fetch verses as normal
2. Click **Add to Plan** for each verse
3. During service, click items in the Plan to load them
4. Click **Go Live** to display

### Using the Mobile Remote

1. Open the Control panel
2. Scan the QR code with your phone
3. Or manually navigate to `http://[your-pc-ip]:4456/remote`
4. Control your overlay from anywhere on the network!

---

## 🎨 Customization

### Configuration File: `config.json`

```json
{
  "port": 4456,
  "obsWebsocketUrl": "ws://127.0.0.1:4455",
  "obsPassword": "",
  "overlaySourceName": "PrimeBible Overlay",
  "defaultTheme": "glass-lower",
  "defaultTranslation": "kjv",
  "defaultAnimation": "fade",
  "maxCharsPerSlide": 200,
  "maxLinesPerSlide": 4,
  "autoAdvanceSlides": false,
  "autoAdvanceDelay": 8000,
  "enableHistory": true,
  "maxHistoryItems": 50,
  "cacheVerses": true,
  "cacheDuration": 3600000
}
```

### Overlay URL Parameters

You can customize the overlay directly via URL:

```
http://localhost:4456/overlay?theme=glass-lower&animation=fade
```

**Available themes:**
- `glass-lower` - Glass lower third (default)
- `minimal-center` - Minimal centered
- `full-screen` - Full screen display
- `split-side` - Side panel
- `corner-card` - Corner card
- `ticker` - Scrolling ticker

**Available animations:**
- `fade` - Fade in/out (default)
- `slide-up` - Slide from bottom
- `slide-down` - Slide from top
- `slide-left` - Slide from right
- `slide-right` - Slide from left
- `zoom` - Zoom in/out
- `none` - Instant (no animation)

---

## 🔧 Advanced Usage

### Multiple Overlays

You can create multiple overlay sources with different themes:

1. Manually add Browser Sources in OBS
2. Use different URLs:
   - `http://localhost:4456/overlay?theme=glass-lower`
   - `http://localhost:4456/overlay?theme=full-screen`
   - `http://localhost:4456/overlay?theme=corner-card`
3. Toggle between them as needed

### API Endpoints

For developers and advanced users:

```bash
# Get verse
GET /api/verse?ref=John%203:16&translation=kjv

# Health check
GET /api/health

# Get history
GET /api/history

# Get favorites
GET /api/favorites

# Add to favorites
POST /api/favorites
Body: {"ref": "John 3:16", "translation": "kjv"}

# OBS: Connect
POST /api/obs/connect
Body: {"url": "ws://127.0.0.1:4455", "password": ""}

# OBS: Ensure overlay exists
POST /api/obs/ensure-overlay
Body: {"theme": "glass-lower"}

# OBS: Show/hide overlay
POST /api/obs/overlay-visible
Body: {"visible": true}
```

### WebSocket Messages

Connect to `ws://localhost:4456/?role=control` (or `overlay` or `remote`)

**Control → Server:**
```json
{
  "type": "goLive",
  "payload": { /* verse data */ },
  "theme": "glass-lower",
  "animation": "fade",
  "autoShowOverlay": true
}
```

**Server → Overlay:**
```json
{
  "type": "displayVerse",
  "payload": { /* verse data */ },
  "theme": "glass-lower",
  "animation": "fade"
}
```

---

## 🎯 Tips & Best Practices

### For Best Results

1. **Use the Control Dock** - Keep PrimeBible integrated in OBS for fastest operation
2. **Pre-load your service** - Use the Service Plan feature to prepare all verses ahead of time
3. **Test your theme** - Different themes work better for different stream layouts
4. **Use keyboard shortcuts** - Much faster than clicking
5. **Enable caching** - Verses load instantly after first fetch

### Performance Optimization

- Keep the overlay Browser Source at **1920x1080**
- Enable **Shutdown source when not visible** in Browser Source settings
- Set **FPS** to 30 in Browser Source settings
- Use **fade** animation for best performance

### Troubleshooting

**OBS won't connect:**
- Verify WebSocket is enabled in OBS
- Check the port number matches (default: 4455)
- Ensure no firewall is blocking the connection
- Try without a password first

**Overlay not showing:**
- Check that the Browser Source is enabled in OBS
- Verify the URL is correct
- Check browser console for errors (F12 in OBS)
- Ensure the source is above your video in the scene

**Verse not found:**
- Verify the reference format (e.g., "John 3:16" not "John 3-16")
- Try a different translation
- Check your internet connection
- Some translations may not support all verses

---

## 🌐 Browser Compatibility

- **OBS Browser Source:** ✅ Chromium-based (built-in)
- **Chrome/Edge:** ✅ Full support
- **Firefox:** ✅ Full support
- **Safari:** ✅ Full support (with some CSS fallbacks)
- **Mobile browsers:** ✅ Optimized for touch

---

## 📝 API Providers

PrimeBible Pro uses the following Bible APIs (in order of preference):

1. **bible-api.com** - Free, no API key required
2. **Additional providers** can be easily added in `server.js`

---

## 🤝 Contributing

This is a community-driven project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your custom themes

---

## 📄 License

MIT License - Use it anywhere, modify it however you want, no restrictions.

---

## 🙏 Credits

Built with love for the church tech community by developers who understand what you need.

**Technologies used:**
- Node.js + Express
- WebSockets (ws)
- OBS WebSocket protocol (obs-websocket-js)
- Modern CSS (Glassmorphism, Grid, Flexbox)
- Vanilla JavaScript (no framework bloat)

---

## 💡 Support

Need help? Found a bug? Want a feature?

- Open an issue on GitHub
- Check the documentation above
- Join our community discussions

---

## 🎉 What's Next?

We're constantly improving PrimeBible Pro. Planned features:
- [ ] Custom font selection
- [ ] Background image support
- [ ] More overlay themes
- [ ] Multi-language UI
- [ ] Cloud sync for favorites and history
- [ ] Service plan templates
- [ ] Verse comparison mode
- [ ] Search functionality
- [ ] Integration with more Bible APIs

**Remember:** Everything will always be free. No paid tiers, no feature locks, no compromises.

---

Made with ❤️ for worship teams, churches, and live streamers everywhere.

**Go make something beautiful.** 🌟

---

## 🆕 Version 2.0 - Production-Ready Features

### What's New

#### 💾 **Data Persistence**
- History, favorites, and service plans now **persist across restarts**
- Automatic saving to JSON files in `data/` directory
- No more losing your prepared content!

#### 🔒 **Remote PIN Authentication**
- Secure your mobile remote with a PIN
- Set `remotePin` in config.json
- Access: `http://your-server:4456/remote?pin=YOUR_PIN`
- Prevents unauthorized control

#### 🔄 **Smart OBS Reconnection**
- Automatic reconnection with exponential backoff
- Survives OBS restarts without manual intervention
- Auto-ensure overlay on connection (if configured)
- Set `connectToObsOnStart: true` for automatic startup connection

#### ⚡ **Enhanced Caching & Timeouts**
- 8-second timeout prevents hung requests
- Improved error messages
- Cache persists across restarts
- Configurable cache duration

#### 📊 **Service Plan Import/Export**
- **JSON Import:** `/api/service-plan/import/json`
- **CSV Import:** `/api/service-plan/import/csv`
- **CSV Export:** `/api/service-plan/export/csv`
- Pre-load entire worship services in seconds!

#### 🔍 **Local Search**
- Search through history, favorites, and service plan
- `/api/search?q=query&translation=kjv`
- Indexed for fast results
- Works offline with your local content

#### ♿ **Accessibility Improvements**
- **Reduced Motion Support:** Respects `prefers-reduced-motion`
- **Safe Area:** Configure top/bottom insets to avoid caption collisions
- **High Contrast Mode:** Perfect for LED walls and projectors
- **Better Text Wrapping:** `text-wrap: balance` and `hyphens: auto`

### Configuration Reference

```json
{
  "port": 4456,
  "obsWebsocketUrl": "ws://127.0.0.1:4455",
  "obsPassword": "",
  "remotePin": "",  // Set this for security!
  "connectToObsOnStart": false,  // Auto-connect to OBS on startup
  "autoCreateOverlayInAllScenes": false,  // Auto-setup overlay
  "cacheVerses": true,
  "cacheDuration": 3600000,  // 1 hour in milliseconds
  "maxHistoryItems": 50,
  "safeAreaTop": 0,  // Pixels to inset from top
  "safeAreaBottom": 0,  // Pixels to inset from bottom
  "highContrastMode": false,  // Enable for LED walls
  "respectReducedMotion": true  // Respect user preferences
}
```

### Advanced URL Parameters

**Overlay Customization:**
```
/overlay?theme=glass-lower&animation=fade&safeBottom=80&safeTop=40&highContrast=true
```

**Parameters:**
- `theme`: glass-lower, minimal-center, full-screen, split-side, corner-card, ticker
- `animation`: fade, slide-up, slide-down, slide-left, slide-right, zoom, none
- `safeBottom`: Bottom safe area in pixels
- `safeTop`: Top safe area in pixels  
- `highContrast`: true/false for high contrast mode

### API Reference

All endpoints return JSON: `{"ok": boolean, "data": any, "error": string}`

**Verse Management:**
```bash
GET  /api/verse?ref=John%203:16&translation=kjv
GET  /api/search?q=love&translation=kjv
```

**History:**
```bash
GET    /api/history
DELETE /api/history
```

**Favorites:**
```bash
GET    /api/favorites
POST   /api/favorites  # Body: {ref, translation}
DELETE /api/favorites/:key
```

**Service Plan:**
```bash
GET  /api/service-plan
POST /api/service-plan  # Body: {plan: [...]}
POST /api/service-plan/import/json
POST /api/service-plan/import/csv
GET  /api/service-plan/export/json
GET  /api/service-plan/export/csv
```

**OBS Control:**
```bash
POST /api/obs/connect  # Body: {url, password}
POST /api/obs/ensure-overlay
POST /api/obs/overlay-visible  # Body: {visible: boolean}
```

**Utilities:**
```bash
GET  /api/health
GET  /api/qr  # Returns QR code for mobile remote
```

### CSV Import Format

```csv
Reference,Translation,Theme,Notes
"John 3:16","kjv","glass-lower","Opening verse"
"Psalm 23","kjv","full-screen","Main message"
"Romans 8:28-29","niv","minimal-center","Closing"
```

### Testing

See `SMOKE_TEST.md` for comprehensive testing checklist covering:
- All 6 overlay themes
- OBS WebSocket integration
- Mobile remote control
- Data persistence
- Import/export
- Search functionality
- Accessibility features
- Performance benchmarks

### Deployment

See `DIGITAL_OCEAN_DEPLOYMENT.md` for complete production deployment guide including:
- Server setup
- SSL configuration
- PM2 process management
- Nginx reverse proxy
- Backup strategy
- Security hardening
- Monitoring & maintenance

