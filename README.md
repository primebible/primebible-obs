<div align="center">

# 🌟 PrimeBible Pro for OBS

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/primebible/primebible-obs?style=social)](https://github.com/primebible/primebible-obs/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/primebible/primebible-obs?style=social)](https://github.com/primebible/primebible-obs/network/members)
[![GitHub issues](https://img.shields.io/github/issues/primebible/primebible-obs)](https://github.com/primebible/primebible-obs/issues)
[![License](https://img.shields.io/github/license/primebible/primebible-obs)](https://github.com/primebible/primebible-obs/blob/main/LICENSE)

</div>

**Professional Bible Overlay System for Live Streaming**

[![Version](https://img.shields.io/badge/version-2.0-blue)](https://github.com/primebible/primebible-obs)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![OBS Studio](https://img.shields.io/badge/OBS%20Studio-28%2B-blueviolet)](https://obsproject.com/)
[![PrimeBible](https://img.shields.io/badge/powered%20by-PrimeBible-orange)](https://primebible.com)

**State-of-the-art Bible verse overlays for worship services, Bible studies, and live streaming**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## Overview

**PrimeBible Pro for OBS** is a professional-grade Bible verse overlay system designed for churches, ministries, and content creators using OBS Studio. It combines stunning visual design, powerful features, and seamless integration to deliver Scripture beautifully during live streams, worship services, and Bible studies.

### 🎯 Key Benefits

- **🎨 Professional Design**: 6 customizable themes with glassmorphic effects and smooth animations
- **⚡ Lightning Fast**: Real-time verse display with built-in caching
- **🎮 Intuitive Control**: Web-based dashboard + mobile remote control
- **🔗 Deep OBS Integration**: Automated setup, source management, and visibility control
- **📱 Multi-Device Support**: Control from desktop, tablet, or phone
- **🖌️ Live Annotation**: Draw, highlight, and annotate verses in real-time
- **📚 Multiple Bible Translations**: Powered by PrimeBible API (default: KJV, AKJV, WEB, ASV - configurable)
- **🛠️ Zero Config**: Works out-of-the-box with sensible defaults
- **🔒 100% Free**: Open source, no subscriptions, no paywalls

---

## ✨ Features

### 🎨 **Stunning Visual Themes**

| Theme | Description | Best For |
|-------|-------------|----------|
| **Glass Lower Third** | Modern glassmorphic design with blur effects | Contemporary worship services |
| **Minimal Center** | Clean, distraction-free centered display | Teaching & Bible studies |
| **Full Screen** | Maximum readability for large venues | Large auditoriums |
| **Split Side** | Professional side panel layout | Conference streams |
| **Corner Card** | Compact, unobtrusive display | Gaming/casual streams |
| **Scrolling Ticker** | News-style animated text | Announcements & extended passages |

### ⚡ **Professional Power Features**

- ✅ **Multi-slide presentations** with automatic text chunking
- ✅ **Keyboard shortcuts** for lightning-fast operation
- ✅ **Service planning** - Pre-load your entire service order, with CSV/JSON import & export
- ✅ **History tracking** - Never lose a verse you've displayed
- ✅ **Favorites system** - Quick access to commonly used verses
- ✅ **Live preview** - See exactly what will appear on stream
- ✅ **OBS WebSocket integration** - Full automation and control
- ✅ **Live annotation tools** - Draw, erase, highlight on-the-fly
- ✅ **Stage display** - Confidence monitor view for speakers
- ✅ **Responsive design** - Works on any screen size or device

### 🎬 **Smooth Animations**

- **Fade** - Classic smooth transition
- **Slide Up / Down / Left / Right** - Dynamic entrance from any direction
- **Zoom In** - Attention-grabbing scale effect
- **None** - Instant display, no animation

All animations respect the viewer's `prefers-reduced-motion` setting.

### 🔧 **Customization Options**

- **Colors**: Custom background, text, and accent colors
- **Fonts**: Curated Google Fonts (Lora, Merriweather, Roboto, Poppins, Montserrat, Open Sans)
- **Sizes**: Adjustable font scaling for any venue
- **Safe Areas**: Offset the overlay to avoid captions and other lower thirds
- **Opacity**: Transparent overlays or solid backgrounds
- **High Contrast Mode**: Enhanced readability for LED walls and projection

---

## 🚀 Quick Start

### Option 1: One-Command Install (Recommended)

```bash
# Clone and start in one command
git clone https://github.com/primebible/primebible-obs.git && cd primebible-obs && npm install && npm start
```

### Option 2: Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/primebible/primebible-obs.git
cd primebible-obs

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

### 🎯 Access Your Interfaces

Once started, open your browser (default port is **4456**, set in `config.json`):

- **Control Panel**: http://localhost:4456/control
- **Overlay**: http://localhost:4456/overlay
- **Mobile Remote**: http://localhost:4456/remote
- **Stage Display**: http://localhost:4456/stage

### 📡 First-Time OBS Setup

1. In OBS, enable the WebSocket server: **Tools → WebSocket Server Settings** (default port `4455`)
2. Open the Control Panel (http://localhost:4456/control)
3. In the **OBS Integration** section, enter your OBS WebSocket URL and password
   (defaults: `ws://127.0.0.1:4455`, blank password)
4. Click **Connect to OBS**
5. Click **Setup Overlay in All Scenes** - this automatically creates a browser source in every scene
6. You're ready to go!

💡 **Tip:** Add the control panel as a Custom Browser Dock in OBS (View → Docks → Custom Browser Docks) so it lives inside OBS.

---

## 💻 System Requirements

### Minimum Requirements

- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **Node.js**: v18.0.0 or higher
- **RAM**: 2GB available
- **OBS Studio**: v28.0+ (v29+ recommended)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Recommended Specs

- **OS**: Windows 11, macOS 13+, Ubuntu 22.04+
- **Node.js**: v20.0.0+
- **RAM**: 4GB+ available
- **OBS Studio**: v29.0+
- **Network**: Gigabit Ethernet (for multi-device control)

---

## 📦 Installation

### Prerequisites

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
2. **Install OBS Studio**: Download from [obsproject.com](https://obsproject.com/)
3. **Enable OBS WebSocket**:
   - Open OBS → Tools → WebSocket Server Settings
   - Enable WebSocket server
   - Note the port (default: 4455) and password (if set)

### Installation Methods

#### Method 1: Git Clone (Recommended)

```bash
git clone https://github.com/primebible/primebible-obs.git
cd primebible-obs
npm install
npm start
```

#### Method 2: Download ZIP

1. Download the [latest release](https://github.com/primebible/primebible-obs/releases)
2. Extract the ZIP file
3. Open terminal in the extracted folder
4. Run `npm install && npm start`

#### Method 3: Docker

```bash
docker build -t primebible-obs .
docker run -d -p 4456:4456 -v ./data:/app/data --name primebible-obs primebible-obs
```

---

## ⚙️ Configuration

### config.json

The `config.json` file controls server behavior and default settings. The most important options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `4456` | HTTP server port |
| `obsWebsocketUrl` | string | `"ws://127.0.0.1:4455"` | OBS WebSocket URL |
| `obsPassword` | string | `""` | OBS WebSocket password |
| `overlaySourceName` | string | `"PrimeBible Overlay"` | Name of the browser source created in OBS |
| `connectToObsOnStart` | boolean | `false` | Auto-connect to OBS when the server starts |
| `autoCreateOverlayInAllScenes` | boolean | `false` | Auto-create the overlay source in every scene on connect |
| `defaultTheme` | string | `"glass-lower"` | Default overlay theme (`glass-lower`, `minimal-center`, `full-screen`, `split-side`, `corner-card`, `ticker`) |
| `defaultTranslation` | string | `"kjv"` | Default Bible translation |
| `defaultAnimation` | string | `"fade"` | Default animation (`fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom`, `none`) |
| `maxCharsPerSlide` | number | `200` | Character limit before splitting into slides |
| `maxLinesPerSlide` | number | `4` | Line limit per slide |
| `autoAdvanceSlides` | boolean | `false` | Automatically advance multi-slide passages |
| `autoAdvanceDelay` | number | `8000` | Auto-advance delay in ms |
| `enableHistory` | boolean | `true` | Track displayed verses in history |
| `maxHistoryItems` | number | `50` | Maximum history entries to keep |
| `cacheVerses` | boolean | `true` | Cache fetched verses in memory |
| `cacheDuration` | number | `3600000` | Cache lifetime in ms (1 hour) |
| `remotePin` | string | `""` | PIN required for all WebSocket clients and mutating API calls (empty = no PIN) |

`config.json` also defines the theme and animation lists (`overlayThemes`, `animations`) and the translation dropdown (`supportedTranslations` — note the server's translation allowlist below takes precedence).

### Overlay URL Parameters

Fine-tune an individual overlay/browser source by appending parameters to its URL:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `theme` | `?theme=glass-lower` | Theme for this overlay instance |
| `animation` | `?animation=fade` | Animation for this overlay instance |
| `safeBottom` / `safeTop` | `?safeBottom=80&safeTop=40` | Pixel offsets to avoid captions/other overlays |
| `highContrast` | `?highContrast=true` | Solid black background, pure white text (LED walls/projection) |
| `pin` | `?pin=1234` | Required when `remotePin` is set (the OBS setup button adds it automatically) |

Example: `http://localhost:4456/overlay?theme=glass-lower&safeBottom=80&highContrast=true`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | (uses `config.json`) | Override the HTTP server port |
| `PRIMEBIBLE_API_URL` | `https://primebible.com/api/verse-preview` | PrimeBible verse API endpoint |
| `PRIMEBIBLE_ALLOWED_TRANSLATIONS` | `KJV,AKJV,WEB,ASV` | Comma-separated translation allowlist |
| `PRIMEBIBLE_ENABLE_BIBLEAPI_FALLBACK` | enabled | Set to `0` to disable the bible-api.com fallback |

Example:

```bash
PORT=8080 PRIMEBIBLE_ALLOWED_TRANSLATIONS=KJV,WEB npm start
```

---

## 🎮 Usage

### Control Panel Interface

#### 1. Search & Display Verses

1. Type a verse reference in the search box (e.g., "John 3:16")
2. Select translation (KJV, AKJV, WEB, ASV by default)
3. Choose theme and animation
4. Click **Fetch Verse** to load it into the live preview
5. Click **Go Live** to show it on stream

#### 2. Multi-Slide Presentations

Long passages are automatically chunked into slides:

- Use **Next/Previous** buttons or arrow keys to navigate
- Progress indicator shows current slide
- Automatic text balancing for readability

#### 3. Service Planning

- **Add to Plan**: Build your entire service order ahead of time
- **Import/Export**: Load plans from CSV or JSON, export for reuse
- **One-Click Display**: Click any plan item to load it instantly
- Plans persist in `data/service-plan.json` across restarts

#### 4. Live Annotation

**To enable annotation tools:**

1. In OBS Studio, add the control panel as a **Browser source** with URL: `http://localhost:4456/control`
2. Right-click the Browser source → **Order → Move to Top** (to set as overlay)
3. Right-click the Browser source → **Interact...**
4. **IMPORTANT:** Click the **Enable button** on the annotation tools in the control panel
5. You can now annotate directly over your overlay!

**Available annotation tools:**

- **Drawing Tool**: Freehand draw on the overlay
- **Highlighter**: Emphasize specific words or phrases
- **Eraser**: Remove annotations
- **Clear All**: Reset the canvas
- **Color Picker**: Choose annotation colors

### Keyboard Shortcuts

Active in the control panel (when not typing in a field):

| Shortcut | Action |
|----------|--------|
| `Enter` | Go live with the current verse |
| `Esc` | Hide overlay |
| `→` | Next slide |
| `←` | Previous slide |

### Mobile Remote Control

Scan the QR code in the control panel or navigate to `http://[your-ip]:4456/remote` on your mobile device.

**Features:**
- Touch-optimized interface
- Real-time sync with desktop
- Quick verse lookup and one-tap go-live
- Optional PIN protection: set `remotePin` in config.json and every WebSocket client requires it — the control panel and remote prompt for it (or open with `?pin=YOUR_PIN` once; it's remembered on that device), and the "Setup Overlay in All Scenes" button bakes it into the OBS source URL. Manually added overlay/stage sources need `?pin=` appended. The PIN also guards all mutating API calls.

### Stage Display

Open `http://[your-ip]:4456/stage` on a monitor facing the speaker — it mirrors the live verse as a confidence monitor.

---

## 🏛️ Architecture

### System Overview

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Control Panel │     │ Mobile Remote │     │ Stage Display │
│ (Web Browser) │     │ (Web Browser) │     │ (Web Browser) │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        └──────────┬──────────┴──────────┬──────────┘
                   │                     │
         ┌─────────┴─────────────────────┐
         │       WebSocket Server        │
         │      (Real-time Sync)         │
         └─────────┬─────────────────────┘
                   │
         ┌─────────┴─────────────────────┐
         │    Node.js Express Server     │
         │   (API + Static Content)      │
         └────┬───────┬──────┬───────┬───┘
              │       │      │       │
      ┌───────┴──┐ ┌──┴──┐ ┌─┴──┐ ┌──┴─────────┐
      │PrimeBible│ │ OBS │ │data│ │  Overlay   │
      │   API    │ │ WS  │ │ /  │ │(OBS Source)│
      └──────────┘ └─────┘ └────┘ └────────────┘
```

### Component Breakdown

#### 1. **Server Layer** (`server.js`)

**Responsibilities:**
- HTTP server (Express)
- WebSocket orchestration (ws library)
- REST API endpoints
- Static file serving
- OBS WebSocket client integration (with auto-reconnect)
- State management and persistence

**Key APIs:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status, uptime, connection counts |
| `/api/verse` | GET | Fetch Bible verses (`?ref=John+3:16&translation=kjv`) |
| `/api/history` | GET/DELETE | Read or clear verse display history |
| `/api/favorites` | GET/POST/DELETE | Manage favorite verses |
| `/api/service-plan` | GET/POST | Load/save service plans |
| `/api/service-plan/import/json` | POST | Import a plan from JSON |
| `/api/service-plan/import/csv` | POST | Import a plan from CSV (fetches each verse) |
| `/api/service-plan/export/json` | GET | Export the plan as JSON |
| `/api/service-plan/export/csv` | GET | Export the plan as CSV |
| `/api/search` | GET | Search history/favorites/plan (`?q=God`) |
| `/api/obs/connect` | POST | Connect to OBS WebSocket |
| `/api/obs/ensure-overlay` | POST | Create/update overlay source in OBS |
| `/api/obs/overlay-visible` | POST | Control overlay visibility |
| `/api/qr` | GET | Generate QR code for mobile access |

#### 2. **Overlay Client** (`public/overlay.html`, `public/overlay.js`)

**Responsibilities:**
- Render Bible verses with themes and animations
- Listen for WebSocket commands from server
- Handle multi-slide presentations
- Apply live annotations and drawing
- Responsive design for all aspect ratios

**WebSocket Events (Received):**
- `displayVerse` / `hideVerse` - Show or hide the verse
- `nextSlide` / `previousSlide` - Navigate multi-slide content
- `setTheme` / `setAnimation` / `setBackground` / `setFonts` / `setFontSizes` - Live styling
- `ticker` - Switch to ticker mode
- `drawing` / `clearDrawing` / `enableDrawing` / `setDrawColor` - Live annotation

#### 3. **Control Panel** (`public/control.html`, `public/control.js`)

**Responsibilities:**
- Search and fetch verses
- Live preview before displaying
- Service plan management
- History and favorites management
- OBS connection and control
- Live customization interface

#### 4. **Data Persistence** (`data/` folder)

- `history.json` - Recently displayed verses
- `favorites.json` - User-favorited verses
- `service-plan.json` - Saved service orders
- `customizations.json` - Saved styling customizations

### Data Flow Example

```
1. User searches "John 3:16" in Control Panel
2. Control JS calls /api/verse?ref=John+3:16&translation=kjv
3. Server fetches from PrimeBible API (with cache)
4. Server returns JSON to Control Panel
5. User clicks "Go Live"
6. Control sends WebSocket message to Server
7. Server broadcasts displayVerse to all Overlay clients
8. Overlay animates verse on screen
9. OBS captures overlay as browser source
10. Verse added to history.json
```

---

## 📡 API Documentation

### REST Endpoints

#### GET /api/verse

Fetch a Bible verse or passage.

**Query Parameters:**
- `ref` (string, required) - Bible reference (e.g., "John 3:16", "Psalm 23:1-6")
- `translation` (string, optional) - Translation code (default from config; must be in the allowlist)

**Response:**
```json
{
  "ok": true,
  "cached": false,
  "data": {
    "provider": "primebible.com",
    "reference": "John 3:16",
    "translationId": "kjv",
    "translationName": "King James Version",
    "verses": [
      { "book": "John", "chapter": 3, "verse": 16, "text": "For God so loved the world..." }
    ],
    "fullText": "16 For God so loved the world...",
    "slides": ["16 For God so loved the world..."],
    "fetchedAt": "2026-07-11T00:00:00.000Z"
  }
}
```

Note: fetching a verse automatically records it in history (when `enableHistory` is on). There is no `POST /api/history`; use `DELETE /api/history` to clear it.

#### POST /api/favorites

Add a verse to favorites.

**Body:**
```json
{
  "ref": "John 3:16",
  "translation": "kjv"
}
```

### WebSocket Events

Clients identify themselves via the `?role=` query parameter on the WebSocket URL (`overlay`, `stage`, `control`, `remote`); the server responds with a `hello` message carrying config and current state, then both sides exchange typed JSON messages.

#### Client → Server (from control panel / remote)

`requestVerse`, `goLive`, `hideOverlay`, `setTheme`, `setAnimation`, `nextSlide`, `previousSlide`, `setBackground`, `setFonts`, `setFontSizes`, `ticker`, `drawing`, `clearDrawing`, `enableDrawing`, `disableDrawing`, `setDrawColor`, `forceRefresh`, `getState`

**goLive**
```json
{
  "type": "goLive",
  "payload": { "reference": "John 3:16", "slides": ["..."], "translationName": "KJV" },
  "theme": "glass-lower",
  "animation": "fade"
}
```

#### Server → Overlay

`displayVerse`, `hideVerse`, `setTheme`, `setAnimation`, `nextSlide`, `previousSlide`, `ticker`, `setBackground`, `setFonts`, `setFontSizes`, `drawing`, `clearDrawing`, `enableDrawing`, `disableDrawing`, `setDrawColor`, `forceRefresh`

---

## 🛠️ Development

### Project Structure

```
primebible-obs/
├── server.js                  # Main Node.js server
├── config.json                # Configuration file
├── package.json               # Dependencies
├── Dockerfile                 # Container build
├── scripts/
│   └── smoke-test.mjs         # Automated smoke test (npm test)
├── public/                    # Static web assets
│   ├── control.html           # Control panel UI
│   ├── control.js             # Control panel logic
│   ├── overlay.html           # Overlay UI
│   ├── overlay.js             # Overlay logic
│   ├── remote.html            # Mobile remote UI
│   ├── remote.js              # Mobile remote logic
│   ├── stage.html             # Stage display (confidence monitor)
│   ├── stage.js               # Stage display logic
│   ├── shared.css             # Shared styles
│   ├── voice-control.js       # Experimental voice verse detection
│   ├── voice-control-ui.js    # Voice control UI component
│   └── voice-demo.html        # Voice control demo page
└── data/                      # Persistent storage (created automatically)
    ├── history.json           # Verse history
    ├── favorites.json         # Favorite verses
    ├── service-plan.json      # Service plan data
    └── customizations.json    # Saved styling
```

### Running in Development Mode

```bash
# Start with auto-reload on file changes
npm run dev
```

### Testing

```bash
# Automated smoke test: boots the server, checks every page, the core API
# endpoints, and the WebSocket contract
npm test

# Full manual test checklist (OBS integration, themes, mobile, persistence)
# See SMOKE_TEST.md
```

### Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick Contribution Guide:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- **JavaScript**: ES6+ syntax, async/await preferred
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc style for functions

---

## 🚀 Deployment

### Digital Ocean Deployment

See [DIGITAL_OCEAN_DEPLOYMENT.md](DIGITAL_OCEAN_DEPLOYMENT.md) for the complete Digital Ocean deployment guide.

### Docker Deployment

```bash
# Build Docker image
docker build -t primebible-obs .

# Run container (persist history/favorites/plans via the data volume)
docker run -d -p 4456:4456 -v ./data:/app/data --name primebible-obs primebible-obs
```

### Production Checklist

- [ ] Set a `remotePin` in config.json to protect the mobile remote
- [ ] Configure OBS WebSocket password
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automatic backups for the `data/` folder
- [ ] Use a process manager (PM2 or systemd)
- [ ] Set up monitoring (optional)

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot connect to OBS WebSocket"

**Solution:**
1. Verify OBS is running
2. Check OBS WebSocket is enabled: Tools → WebSocket Server Settings
3. Verify the URL (default: `ws://127.0.0.1:4455`) and password match your config
4. Ensure firewall allows WebSocket connections

#### "Overlay not appearing in OBS"

**Solution:**
1. Verify overlay URL is correct: `http://localhost:4456/overlay`
2. Check browser source dimensions match your canvas (1920x1080)
3. Ensure overlay source is not hidden in OBS
4. Try clicking "Refresh cache" in OBS browser source properties

#### "Verses not loading"

**Solution:**
1. Check internet connection (required for Bible API)
2. Verify PrimeBible API is accessible
3. Check server console for API errors
4. The bible-api.com fallback is on by default; make sure `PRIMEBIBLE_ENABLE_BIBLEAPI_FALLBACK` is not set to `0`

#### "Mobile remote not working"

**Solution:**
1. Ensure devices are on same network
2. Use your computer's local IP (not localhost)
3. Check firewall allows port 4456 connections
4. If you set a `remotePin`, the remote will prompt for it (or open `/remote?pin=YOUR_PIN`)

### Health Check

Visit `http://localhost:4456/api/health` to see server status, uptime, and live connection counts — useful for confirming the server is up and clients are connected.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

- 🐛 **Report bugs**: Open an [issue](https://github.com/primebible/primebible-obs/issues)
- 💡 **Suggest features**: Start a [discussion](https://github.com/primebible/primebible-obs/discussions)
- 📝 **Improve docs**: Submit a PR for README updates
- 🎨 **Add themes**: Create new overlay themes (see [CONTRIBUTING.md](CONTRIBUTING.md))
- 🌐 **Translations**: Help translate the interface

### Contributors

Thanks to all our contributors! 🙏

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **PrimeBible API**: Free for non-commercial use
- **OBS Studio**: GPL-2.0
- **Node.js dependencies**: See individual package licenses

---

## 📞 Support

### Getting Help

- 📚 **Documentation**: [QUICKSTART.md](QUICKSTART.md)
- 💬 **Community**: [GitHub Discussions](https://github.com/primebible/primebible-obs/discussions)
- 🐛 **Issues**: [Bug Tracker](https://github.com/primebible/primebible-obs/issues)
- 📧 **Email**: support@primebible.com
- 🌐 **Website**: [primebible.com](https://primebible.com)

### Sponsorship

PrimeBible OBS is 100% free and open source. If this project has blessed your ministry, consider supporting:

- ⭐ Star this repository
- 💬 Share with your church/community
- 💙 [Sponsor PrimeBible](https://github.com/sponsors/primebible) (optional)

---

## 🚀 Roadmap

### Version 2.1 (Planned)
- [ ] Additional overlay themes (Neon, Classic, Minimal Modern)
- [ ] Typewriter animation
- [ ] Voice-activated verse detection (experimental build ships in `public/voice-*`)
- [ ] Enhanced mobile remote with gesture controls
- [ ] Multi-language interface (Spanish, Portuguese, Korean)
- [ ] Hotkey support for physical stream deck integration
- [ ] Enhanced stage display with speaker notes

### Version 2.2 (Future)
- [ ] Cloud sync for service plans
- [ ] Collaborative remote control (multiple devices)
- [ ] Custom theme builder with visual editor
- [ ] Automated sermon note generation
- [ ] Integration with other Bible APIs (Crossway, YouVersion)

---

## 📊 Project Stats

- **Lines of Code**: ~5,000
- **Languages**: JavaScript, HTML, CSS
- **License**: MIT
- **Status**: Active Development
- **First Release**: November 2025

---

## 🙏 Acknowledgments

- **PrimeBible**: For providing the exceptional Bible API
- **OBS Studio**: For the amazing streaming platform
- **obs-websocket-js**: For WebSocket integration library
- **Our Contributors**: Thank you for making this project better!

---

<div align="center">

**Made with ❤️ by [PrimeBible](https://primebible.com)**

**Bringing Scripture to Life in Your Streams**

[Website](https://primebible.com) • [GitHub](https://github.com/primebible/primebible-obs) • [Documentation](QUICKSTART.md) • [Issues](https://github.com/primebible/primebible-obs/issues)

© 2025 PrimeBible. Released under the MIT License.

</div>
