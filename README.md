<div align="center">

# 🌟 PrimeBible Pro for OBS

**Professional Bible Overlay System for Live Streaming**

[![Version](https://img.shields.io/badge/version-2.0-blue)](https://github.com/primebible/primebible-obs)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![OBS Studio](https://img.shields.io/badge/OBS%20Studio-29%2B-blueviolet)](https://obsproject.com/)
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
- **⚡ Lightning Fast**: Real-time verse display with < 100ms latency
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
- ✅ **Service planning** - Pre-load your entire service order
- ✅ **History tracking** - Never lose a verse you've displayed
- ✅ **Favorites system** - Quick access to commonly used verses
- ✅ **Real-time preview** - See exactly what will appear on stream
- ✅ **OBS WebSocket integration** - Full automation and control
- ✅ **Live annotation tools** - Draw, erase, highlight on-the-fly
- ✅ **Responsive design** - Works on any screen size or device

### 🎬 **Smooth Animations**

- **Fade** - Classic smooth transition
- **Slide** - Dynamic entrance/exit
- **Zoom** - Attention-grabbing scale effect
- **Typewriter** - Character-by-character reveal

### 🔧 **Customization Options**

- **Colors**: Custom background, text, and accent colors
- **Fonts**: Google Fonts integration with 1000+ typefaces
- **Sizes**: Adjustable font scaling for any venue
- **Positioning**: Fine-tune placement and alignment
- **Opacity**: Transparent overlays or solid backgrounds
- **High Contrast Mode**: Enhanced readability for accessibility

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

Once started, open your browser:

- **Control Panel**: http://localhost:3000/control
- **Overlay**: http://localhost:3000/overlay
- **Mobile Remote**: http://localhost:3000/remote
- **Stage Display**: http://localhost:3000/stage

### 📡 First-Time OBS Setup

1. Open the Control Panel (http://localhost:3000/control)
2. In the **OBS Connection** section, enter your OBS WebSocket details:
   - Default password: (usually blank for local OBS)
   - Port: `4455` (default)
3. Click **Connect to OBS**
4. Click **Add Overlay to OBS** - this automatically creates a browser source
5. You're ready to go!

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

#### Method 1: NPM (Recommended for Developers)

```bash
npm install -g primebible-obs
primebible-obs start
```

#### Method 2: Git Clone (Recommended for Contributors)

```bash
git clone https://github.com/primebible/primebible-obs.git
cd primebible-obs
npm install
npm start
```

#### Method 3: Download ZIP

1. Download the [latest release](https://github.com/primebible/primebible-obs/releases)
2. Extract the ZIP file
3. Open terminal in the extracted folder
4. Run `npm install && npm start`

---

## ⚙️ Configuration

### config.json

The `config.json` file controls server behavior and default settings:

```json
{
  "port": 3000,
  "obsWebSocketPort": 4455,
  "obsWebSocketPassword": "",
  "primeBibleApiKey": "",
  "fallbackBibleApi": true,
  "logLevel": "info",
  "enableCors": true,
  "maxHistoryItems": 100,
  "defaultTheme": "glass",
  "defaultAnimation": "fade"
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `3000` | HTTP server port |
| `obsWebSocketPort` | number | `4455` | OBS WebSocket port |
| `obsWebSocketPassword` | string | `""` | OBS WebSocket password |
| `primeBibleApiKey` | string | `""` | Optional PrimeBible API key for enhanced features |
| `fallbackBibleApi` | boolean | `true` | Use fallback API if PrimeBible unavailable |
| `logLevel` | string | `"info"` | Logging level: `debug`, `info`, `warn`, `error` |
| `enableCors` | boolean | `true` | Enable CORS for remote access |
| `maxHistoryItems` | number | `100` | Maximum history entries to keep |
| `defaultTheme` | string | `"glass"` | Default overlay theme |
| `defaultAnimation` | string | `"fade"` | Default animation style |

### Environment Variables

For production deployments, use environment variables:

```bash
PORT=3000
OBS_WEBSOCKET_PORT=4455
OBS_WEBSOCKET_PASSWORD=your_password
PRIMEBIBLE_API_KEY=your_api_key
NODE_ENV=production
```

---

## 🎮 Usage

### Control Panel Interface

#### 1. Search & Display Verses

1. Type a verse reference in the search box (e.g., "John 3:16")
2. Select translation (KJV, NIV, ESV, etc.)
3. Choose theme and animation
4. Click **Preview** to see it locally
5. Click **Display on Stream** to show it live

#### 2. Multi-Slide Presentations

Long passages are automatically chunked into slides:

- Use **Next/Previous** buttons or arrow keys to navigate
- Progress indicator shows current slide
- Automatic text balancing for readability

#### 3. Service Planning

- **Add to Plan**: Build your entire service order ahead of time
- **Drag to Reorder**: Rearrange verses in your plan
- **Save/Load Plans**: Reuse service plans week after week
- **One-Click Display**: Click any plan item to display instantly

#### 4. Live Annotation

- **Drawing Tool**: Freehand draw on the overlay
- **Highlighter**: Emphasize specific words or phrases
- **Eraser**: Remove annotations
- **Clear All**: Reset the canvas
- **Color Picker**: Choose annotation colors

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Show/Hide overlay |
| `Enter` | Display current verse |
| `→` | Next slide |
| `←` | Previous slide |
| `Esc` | Hide overlay |
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + P` | Open service plan |
| `Ctrl/Cmd + H` | View history |
| `Ctrl/Cmd + F` | View favorites |

### Mobile Remote Control

Scan the QR code in the control panel or navigate to `http://[your-ip]:3000/remote` on your mobile device.

**Features:**
- Full control panel access
- Touch-optimized interface
- Real-time sync with desktop
- Service plan navigation
- Quick verse lookup

---

## 🏛️ Architecture

### System Overview

```
┌──────────────────────────────────────────┐
│          PrimeBible OBS Architecture          │
└──────────────────────────────────────────┘

┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Control Panel  │     │  Mobile Remote │     │  Stage Display │
│ (Web Browser) │     │  (Web Browser) │     │ (Web Browser) │
└────────┬───────┘     └───────┬───────┘     └───────┬───────┘
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   │                   │
         ┌─────────┴────────────────────────┐
         │       WebSocket Server        │
         │      (Real-time Sync)         │
         └─────────┬────────────────────────┘
                   │
         ┌─────────┴────────────────────────┐
         │    Node.js Express Server    │
         │   (API + Static Content)    │
         └────┬───────┬──────┬───────┬────┘
              │       │      │       │
      ┌───────┴─┐  ┌─┴──┐  ┌┴──┐  ┌─┴────┐
      │ PrimeBible│  │OBS│  │DB│  │ Overlay │
      │    API    │  │ WS│  │  │  │(OBS Source)│
      └─────────┘  └───┘  └───┘  └─────────┘
```

### Component Breakdown

#### 1. **Server Layer** (`server.js`)

**Responsibilities:**
- HTTP/HTTPS server (Express)
- WebSocket orchestration (ws library)
- REST API endpoints
- Static file serving
- OBS WebSocket client integration
- State management and persistence

**Key APIs:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verse` | GET | Fetch Bible verses from PrimeBible API |
| `/api/history` | GET/POST | Manage verse display history |
| `/api/favorites` | GET/POST/DELETE | Manage favorite verses |
| `/api/service-plan` | GET/POST | Load/save service plans |
| `/api/obs/connect` | POST | Connect to OBS WebSocket |
| `/api/obs/ensure-overlay` | POST | Create/update overlay source in OBS |
| `/api/obs/overlay-visible` | GET/POST | Control overlay visibility |
| `/api/qr` | GET | Generate QR code for mobile access |

#### 2. **Overlay Client** (`public/overlay.html`, `public/overlay.js`)

**Responsibilities:**
- Render Bible verses with themes and animations
- Listen for WebSocket commands from server
- Handle multi-slide presentations
- Apply live annotations and drawing
- Responsive design for all aspect ratios

**WebSocket Events (Received):**
- `displayVerse` - Show verse with theme/animation
- `hideOverlay` - Hide current overlay
- `nextSlide` / `prevSlide` - Navigate multi-slide content
- `updateStyle` - Change colors, fonts, sizes
- `drawing` - Live annotation data

#### 3. **Control Panel** (`public/control.html`, `public/control.js`)

**Responsibilities:**
- Search and fetch verses
- Preview before displaying
- Service plan management
- History and favorites management
- OBS connection and control
- Live customization interface

#### 4. **Data Persistence** (`data/` folder)

- `history.json` - Recently displayed verses
- `favorites.json` - User-favorited verses
- `service-plan.json` - Saved service orders

### Data Flow Example

```
1. User searches "John 3:16" in Control Panel
2. Control JS calls /api/verse?reference=John+3:16&translation=KJV
3. Server fetches from PrimeBible API (with cache)
4. Server returns JSON to Control Panel
5. User clicks "Display"
6. Control sends WebSocket message to Server
7. Server broadcasts to all Overlay clients
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
- `reference` (string, required) - Bible reference (e.g., "John 3:16", "Psalm 23:1-6")
- `translation` (string, optional) - Bible translation code (default: "KJV")

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "John 3:16",
    "translation": "KJV",
    "text": "For God so loved the world...",
    "verses": [
      {
        "verse": 16,
        "text": "For God so loved the world..."
      }
    ]
  }
}
```

#### POST /api/history

Add verse to history.

**Body:**
```json
{
  "reference": "John 3:16",
  "translation": "KJV",
  "text": "For God so loved the world..."
}
```

### WebSocket Events

#### Client → Server

**displayVerse**
```json
{
  "type": "displayVerse",
  "payload": {
    "reference": "John 3:16",
    "text": "For God so loved the world...",
    "translation": "KJV",
    "theme": "glass",
    "animation": "fade"
  }
}
```

---

## 🛠️ Development

### Project Structure

```
primebible-obs/
├── server.js              # Main Node.js server
├── config.json            # Configuration file
├── package.json           # Dependencies
├── public/                # Static web assets
│   ├── control.html       # Control panel UI
│   ├── control.js         # Control panel logic
│   ├── overlay.html       # Overlay UI
│   ├── overlay.js         # Overlay logic
│   ├── remote.html        # Mobile remote UI
│   ├── remote.js          # Mobile remote logic
│   └── stage.html         # Stage display (confidence monitor)
└── data/                  # Persistent storage
    ├── history.json       # Verse history
    ├── favorites.json     # Favorite verses
    └── service-plan.json  # Service plan data
```

### Running in Development Mode

```bash
# Enable debug logging
export NODE_ENV=development
export LOG_LEVEL=debug

# Start with auto-reload (using nodemon)
npm install -g nodemon
nodemon server.js
```

### Testing

```bash
# Run smoke tests
npm test

# Manual testing checklist
# See SMOKE_TEST.md for comprehensive test cases
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

See [DIGITAL_OCEAN_DEPLOYMENT.md](DIGITAL_OCEAN_DEPLOYMENT.md) for complete Digital Ocean deployment guide.

### Docker Deployment

```bash
# Build Docker image
docker build -t primebible-obs .

# Run container
docker run -d -p 3000:3000 --name primebible-obs primebible-obs
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure OBS WebSocket password
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automatic backups for `/data` folder
- [ ] Configure log rotation
- [ ] Set up monitoring (optional)

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot connect to OBS WebSocket"

**Solution:**
1. Verify OBS is running
2. Check OBS WebSocket is enabled: Tools → WebSocket Server Settings
3. Verify port (default: 4455) and password match your config
4. Ensure firewall allows WebSocket connections

#### "Overlay not appearing in OBS"

**Solution:**
1. Verify overlay URL is correct: `http://localhost:3000/overlay`
2. Check browser source dimensions match your canvas
3. Ensure overlay source is not hidden in OBS
4. Try clicking "Refresh cache" in OBS browser source properties

#### "Verses not loading"

**Solution:**
1. Check internet connection (required for Bible API)
2. Verify PrimeBible API is accessible
3. Check server console for API errors
4. Try alternative Bible API if enabled in config

#### "Mobile remote not working"

**Solution:**
1. Ensure devices are on same network
2. Use your computer's local IP (not localhost)
3. Check firewall allows port 3000 connections
4. Verify CORS is enabled in config.json

### Debug Mode

```bash
export LOG_LEVEL=debug
npm start
```

This enables verbose logging for troubleshooting.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

- 🐛 **Report bugs**: Open an [issue](https://github.com/primebible/primebible-obs/issues)
- 💡 **Suggest features**: Start a [discussion](https://github.com/primebible/primebible-obs/discussions)
- 📝 **Improve docs**: Submit a PR for README updates
- 🎨 **Add themes**: Create new overlay themes
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
- **Languages**: JavaScript (58.3%), HTML (30.1%), CSS (11.6%)
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
