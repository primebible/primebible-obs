# 🚀 Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Node.js
Download and install from: https://nodejs.org
(Choose the LTS version)

### Step 2: Install Dependencies
Open terminal/command prompt in this folder and run:
```bash
npm install
```

### Step 3: Start the Server
```bash
npm start
```

### Step 4: Open Control Panel
Open your browser to: http://localhost:4456/control

### Step 5: Connect to OBS (Optional but Recommended)
1. Open OBS Studio
2. Go to Tools → WebSocket Server Settings
3. Enable WebSocket Server
4. In PrimeBible Control, click "Connect to OBS"
5. Click "Setup Overlay in All Scenes"

## 🎯 First Verse

1. Type "John 3:16" in the reference box
2. Click "Fetch Verse"
3. Click "Go Live"
4. See it appear in OBS!

## 📱 Mobile Remote

Scan the QR code in the Control panel to access the remote on your phone!

## 💡 Pro Tips

- **Add as OBS Dock:** View → Docks → Custom Browser Docks
  - Name: PrimeBible Control
  - URL: http://localhost:4456/control

- **Keyboard Shortcuts:**
  - Enter = Go Live
  - Esc = Hide
  - Arrow Keys = Navigate slides

- **Service Planning:**
  - Fetch verses ahead of time
  - Add them to your plan
  - Click to instantly load during service
- **Using Annotation Tools:**
  1. In OBS, add the control as a Browser source (http://localhost:4456/control)
  2. Right-click the Browser source → **Order → Move to Top** to set as overlay
  3. Right-click the Browser source → **Interact...**
  4. **IMPORTANT:** Click the **Enable button** on the annotation tools in the control panel
  5. You can now annotate directly over your overlay!

That's it! You're ready to go. 🌟

For detailed documentation, see README.md
