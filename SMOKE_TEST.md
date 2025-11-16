# 🧪 PrimeBible Pro - Smoke Test Checklist

## Pre-Test Setup

### 1. Environment Preparation
```bash
npm install
npm start
```

Verify server starts successfully and shows:
```
✨ PrimeBible Pro for OBS ✨
Server running on: http://localhost:4456
```

### 2. OBS Studio Setup
- OBS Studio 28+ installed
- WebSocket Server enabled (Tools → WebSocket Server Settings)
- Default port: 4455
- Note your password if set

---

## 🎯 Core Functionality Tests

### Test 1: Single Verse Fetch
**Objective:** Verify basic verse fetching and display

1. Open http://localhost:4456/control
2. Enter reference: `John 3:16`
3. Select translation: `KJV`
4. Click "Fetch Verse"

**Expected:**
- ✅ Preview shows: "For God so loved the world..."
- ✅ Reference displays correctly
- ✅ Translation shows as "KJV"
- ✅ No slides (single verse)
- ✅ "Go Live" button becomes enabled

### Test 2: Multi-Verse Passage (Auto-Split Slides)
**Objective:** Verify automatic slide chunking for longer passages

1. Enter reference: `John 3:16-18`
2. Select translation: `KJV`
3. Click "Fetch Verse"

**Expected:**
- ✅ Preview shows multiple slides labeled [Slide 1 of X], [Slide 2 of X], etc.
- ✅ Each slide respects maxCharsPerSlide (200) and maxLinesPerSlide (4)
- ✅ Text is cleanly broken at sentence boundaries
- ✅ No orphaned words or awkward breaks

### Test 3: Lower Third Theme
**Objective:** Verify glass lower third renders cleanly

1. With passage loaded, select theme: `Glass Lower`
2. Select animation: `Fade`
3. Click "Go Live"

**Expected:**
- ✅ Overlay appears at bottom of screen with glassmorphic design
- ✅ Blur effect visible behind overlay
- ✅ Text is crisp and readable
- ✅ Reference and translation displayed on right
- ✅ Slide indicator shows (if multi-slide: "1 / 3")
- ✅ Fade animation is smooth (400ms)

### Test 4: Full Screen Theme
**Objective:** Verify full screen display for maximum readability

1. Select theme: `Full Screen`
2. Click "Go Live"

**Expected:**
- ✅ Dark semi-transparent background covers entire screen
- ✅ Large centered text (56px)
- ✅ Reference and translation at bottom with divider line
- ✅ Text is perfectly centered and balanced
- ✅ Slide indicator visible (if multi-slide)

### Test 5: Ticker Mode
**Objective:** Verify smooth scrolling ticker with no frame drops

1. Select theme: `Ticker` (or use ticker button)
2. Load any verse
3. Click "Go Live"
4. Observe for 30 seconds

**Expected:**
- ✅ Text scrolls smoothly from right to left
- ✅ No frame hitching or stuttering
- ✅ Text repeats seamlessly (no gaps)
- ✅ Background blur effect is smooth
- ✅ Animation runs at consistent speed (~30s per loop)
- ✅ No text clipping or overflow

**Performance Check:**
- Open browser DevTools (F12 in OBS Browser Source)
- Monitor FPS - should maintain 30fps consistently
- No console errors

---

## 🎮 OBS Integration Tests

### Test 6: OBS WebSocket Connection
**Objective:** Verify successful OBS connection

1. In Control panel, go to OBS Integration section
2. Verify URL: `ws://127.0.0.1:4455`
3. Enter password (if you set one)
4. Click "Connect to OBS"

**Expected:**
- ✅ Status changes to "OBS Connected" with green dot
- ✅ "Setup Overlay in All Scenes" button becomes enabled
- ✅ Console shows: `[OBS] ✓ Connected`
- ✅ Connection status broadcasts to all clients

**If Connection Fails:**
- Verify OBS WebSocket is enabled
- Check port number matches
- Try without password
- Check firewall settings

### Test 7: CreateInput - Add Overlay to All Scenes
**Objective:** Verify automatic overlay creation in all scenes

1. With OBS connected, click "Setup Overlay in All Scenes"
2. In OBS, check all your scenes

**Expected:**
- ✅ Alert shows "Overlay ready in all scenes (X created)"
- ✅ Each scene now has a Browser Source named "PrimeBible Overlay"
- ✅ Browser Source URL is: `http://127.0.0.1:4456/overlay.html?theme=glass-lower`
- ✅ Source dimensions are 1920x1080
- ✅ Source is initially hidden (not enabled)
- ✅ If run again, updates existing sources instead of duplicating

**Verify in OBS:**
- Right-click Browser Source → Properties
- Check URL matches
- Verify "Shutdown source when not visible" is checked
- FPS should be 30

### Test 8: Overlay Visibility Control
**Objective:** Verify hide/show overlay reliably via OBS WebSocket

1. Ensure OBS is connected and overlay exists in current scene
2. In Control panel, load a verse
3. Click "Go Live"

**Expected:**
- ✅ Overlay Browser Source automatically enables in OBS
- ✅ Verse appears on program output
- ✅ Console shows: `[OBS] Set overlay visible: true`

4. Click "Hide"

**Expected:**
- ✅ Overlay Browser Source disables in OBS
- ✅ Verse disappears from program output
- ✅ Console shows: `[OBS] Set overlay visible: false`

5. Test rapid toggling (show/hide/show/hide)

**Expected:**
- ✅ All toggles work reliably
- ✅ No race conditions or stuck states
- ✅ No "source not found" errors

### Test 9: Multi-Scene Support
**Objective:** Verify overlay works across scene switches

1. Create 3 scenes in OBS: "Scene 1", "Scene 2", "Scene 3"
2. Run "Setup Overlay in All Scenes"
3. Load a verse and go live on Scene 1
4. Switch to Scene 2 in OBS

**Expected:**
- ✅ Overlay appears correctly on Scene 2
- ✅ Same content as Scene 1
- ✅ No flickering or re-loading

5. Click "Hide" while on Scene 2
6. Switch to Scene 3

**Expected:**
- ✅ Overlay remains hidden on Scene 3
- ✅ State is consistent across scenes

---

## 📱 Mobile Remote Tests

### Test 10: Mobile Remote Access
**Objective:** Verify mobile control from same network

**Setup:**
1. Get your PC's local IP address
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig` → look for inet address
   - Usually: 192.168.1.x or 10.0.0.x

2. On your phone (on same WiFi network):
   - Open browser
   - Navigate to: `http://[YOUR-PC-IP]:4456/remote`
   - Example: `http://192.168.1.100:4456/remote`

**OR use QR code:**
1. In Control panel, go to "Mobile Remote" section
2. Scan QR code with phone camera
3. Tap link to open

**Expected:**
- ✅ Remote page loads on phone
- ✅ Connection status shows "Connected"
- ✅ Interface is touch-friendly and responsive
- ✅ All buttons are large and tappable

### Test 11: Remote Verse Control
**Objective:** Trigger verse from phone and verify it goes live

1. On mobile remote, enter: `Psalm 23`
2. Select translation: `KJV`
3. Select theme: `Glass Lower`
4. Tap "Go Live"

**Expected:**
- ✅ Verse fetches successfully
- ✅ Overlay appears in OBS automatically
- ✅ Correct verse displays on program output
- ✅ Status shows "🔴 LIVE" badge for 5 seconds
- ✅ Phone vibrates (if supported)

5. Tap "Hide"

**Expected:**
- ✅ Overlay hides in OBS
- ✅ Confirmation feedback on phone

### Test 12: Quick Reference Buttons
**Objective:** Test one-tap verse loading

1. On mobile remote, tap "John 3:16" quick button

**Expected:**
- ✅ Reference field fills with "John 3:16"
- ✅ Feedback shows "Selected: John 3:16"
- ✅ Ready to go live with one more tap

---

## 🔒 Security & Authentication Tests

### Test 13: Remote PIN Authentication
**Objective:** Verify PIN protection for remote access

1. Stop server
2. Edit `config.json`:
   ```json
   "remotePin": "1234"
   ```
3. Restart server
4. Try to access remote without PIN: `http://localhost:4456/remote`

**Expected:**
- ✅ Connection immediately closes
- ✅ Error message: "Invalid PIN"
- ✅ WebSocket connection rejected

5. Access with PIN: `http://localhost:4456/remote?pin=1234`

**Expected:**
- ✅ Connection succeeds
- ✅ Remote functions normally
- ✅ No error messages

6. Set `remotePin` back to `""` to disable

---

## 💾 Persistence Tests

### Test 14: History Persistence
**Objective:** Verify history survives restart

1. Fetch 3 different verses
2. Verify they appear in History section
3. Stop server (`Ctrl+C`)
4. Restart server (`npm start`)
5. Reload Control page

**Expected:**
- ✅ History section shows all 3 verses
- ✅ Order is preserved (newest first)
- ✅ All metadata intact (reference, translation, preview, timestamp)
- ✅ File exists: `data/history.json`

### Test 15: Favorites Persistence
**Objective:** Verify favorites survive restart

1. Fetch a verse
2. Click "Add" in Favorites section
3. Verify it appears in Favorites list
4. Stop and restart server
5. Reload Control page

**Expected:**
- ✅ Favorite still appears
- ✅ Click favorite to load it
- ✅ File exists: `data/favorites.json`

### Test 16: Service Plan Persistence
**Objective:** Verify service plan survives restart

1. Fetch 3 verses
2. Add each to Service Plan
3. Stop and restart server
4. Reload Control page

**Expected:**
- ✅ All 3 items still in Service Plan
- ✅ Order preserved
- ✅ Click items to load them
- ✅ File exists: `data/service-plan.json`

---

## 📊 Import/Export Tests

### Test 17: Service Plan JSON Import
**Objective:** Import service plan from JSON

1. Create file `test-plan.json`:
```json
{
  "plan": [
    {
      "reference": "Genesis 1:1",
      "translationId": "kjv",
      "translationName": "KJV",
      "fullText": "In the beginning God created the heaven and the earth.",
      "slides": ["In the beginning God created the heaven and the earth."]
    },
    {
      "reference": "John 3:16",
      "translationId": "kjv",
      "translationName": "KJV",
      "fullText": "For God so loved the world...",
      "slides": ["For God so loved the world..."]
    }
  ]
}
```

2. Use curl or Postman:
```bash
curl -X POST http://localhost:4456/api/service-plan/import/json \
  -H "Content-Type: application/json" \
  -d @test-plan.json
```

**Expected:**
- ✅ Response: `{"ok": true, "count": 2}`
- ✅ Service Plan section shows 2 items
- ✅ Both verses are immediately usable

### Test 18: Service Plan CSV Import
**Objective:** Import from CSV file

1. Create file `test-plan.csv`:
```csv
Reference,Translation,Theme,Notes
"Genesis 1:1","kjv","glass-lower","Opening verse"
"John 3:16","kjv","full-screen","Main message"
"Psalm 23","kjv","minimal-center","Closing"
```

2. Import:
```bash
curl -X POST http://localhost:4456/api/service-plan/import/csv \
  -H "Content-Type: text/plain" \
  --data-binary @test-plan.csv
```

**Expected:**
- ✅ Verses are fetched automatically
- ✅ Response shows count: 3
- ✅ Service Plan populates with all verses
- ✅ Notes and themes are attached
- ✅ Invalid references are skipped with warning

### Test 19: Service Plan CSV Export
**Objective:** Export current plan to CSV

1. Have service plan with 3+ items
2. Visit: `http://localhost:4456/api/service-plan/export/csv`

**Expected:**
- ✅ CSV file downloads automatically
- ✅ Filename: `service-plan.csv`
- ✅ Contains all current items
- ✅ Format: Reference, Translation, Theme, Notes
- ✅ Can be re-imported successfully

---

## 🔍 Search Tests

### Test 20: Local Search Functionality
**Objective:** Search through history, favorites, and service plan

1. Build a corpus:
   - Fetch and view: John 3:16, Psalm 23, Genesis 1:1
   - Add John 3:16 to favorites
   - Add Psalm 23 to service plan

2. Search for "God":
```bash
curl "http://localhost:4456/api/search?q=God&translation=kjv"
```

**Expected:**
- ✅ Returns results matching "God" in reference or text
- ✅ Results include source (history/favorite/plan)
- ✅ Deduplicates (same verse appears once)
- ✅ Limit 20 results max

3. Search for "Psalm":

**Expected:**
- ✅ Returns Psalm 23
- ✅ Shows preview text
- ✅ Indicates source

4. Search with 1 character: `?q=a`

**Expected:**
- ✅ Error 400: "Query too short (min 2 characters)"

---

## ⚡ Performance & Reliability Tests

### Test 21: Verse Caching
**Objective:** Verify caching improves performance

1. Fetch `John 3:16` for first time
2. Note response time (should be ~500-2000ms)
3. Fetch `John 3:16` again immediately

**Expected:**
- ✅ Second fetch is instant (<50ms)
- ✅ Response includes `"cached": true`
- ✅ No network request made (check DevTools Network tab)

4. Wait for cache expiration (default: 1 hour) OR restart server
5. Fetch again

**Expected:**
- ✅ Full fetch happens again
- ✅ `"cached": false` in response

### Test 22: Fetch Timeout Handling
**Objective:** Verify timeout protection

1. Disconnect internet or block bible-api.com
2. Try to fetch a verse

**Expected:**
- ✅ Request times out after 8 seconds
- ✅ Error message: "Request timeout - please try again"
- ✅ UI remains responsive
- ✅ No browser freeze

3. Reconnect internet
4. Retry same verse

**Expected:**
- ✅ Fetches successfully
- ✅ No lingering errors

### Test 23: OBS Auto-Reconnect
**Objective:** Verify automatic OBS reconnection

1. Set in `config.json`:
   ```json
   "connectToObsOnStart": true
   ```

2. Start server (OBS should NOT be running)

**Expected:**
- ✅ Server starts successfully
- ✅ Console shows reconnect attempts
- ✅ Exponential backoff (5s, 10s, 20s, 40s...)
- ✅ Gives up after 10 attempts
- ✅ Server remains functional

3. Start OBS and enable WebSocket
4. Wait up to 60 seconds

**Expected:**
- ✅ Automatically connects when OBS becomes available
- ✅ Status updates to "Connected"
- ✅ If `autoCreateOverlayInAllScenes: true`, overlay is created

5. Close OBS while server running

**Expected:**
- ✅ Detects disconnection
- ✅ Begins reconnect attempts
- ✅ Status shows "Offline"

6. Restart OBS

**Expected:**
- ✅ Reconnects automatically
- ✅ No manual intervention needed

---

## 🎨 Accessibility Tests

### Test 24: Reduced Motion Support
**Objective:** Verify animations respect user preferences

1. In browser DevTools, enable "Reduce Motion":
   - Chrome: DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`
   - Or set OS-level reduced motion preference

2. Load overlay page with various animations
3. Go live with `slide-up`, `zoom`, etc.

**Expected:**
- ✅ All complex animations reduced to simple fade
- ✅ Ticker animation disabled (static text)
- ✅ Transition time reduced to 200ms
- ✅ No position transforms occur
- ✅ Content still shows/hides correctly

### Test 25: Safe Area / Caption Collision Avoidance
**Objective:** Verify safe-area prevents caption collisions

1. Access overlay with safe-area params:
   ```
   http://localhost:4456/overlay?theme=glass-lower&safeBottom=80&safeTop=40
   ```

2. Go live with a verse

**Expected:**
- ✅ Lower third is 80px higher than default
- ✅ Doesn't overlap bottom captions/overlays
- ✅ Top elements respect top safe area

3. Switch to ticker theme

**Expected:**
- ✅ Ticker starts 80px above bottom
- ✅ No content clipped

### Test 26: High Contrast Mode
**Objective:** Verify improved visibility for LED walls

1. Access overlay with high contrast:
   ```
   http://localhost:4456/overlay?theme=glass-lower&highContrast=true
   ```

2. Go live with verse

**Expected:**
- ✅ Background is solid black (0.95 opacity)
- ✅ Text is pure white
- ✅ Border is pure white
- ✅ No transparency/blur effects
- ✅ Maximum contrast ratio
- ✅ Suitable for projection/LED walls

### Test 27: Text Wrapping Quality
**Objective:** Verify balanced line breaks

1. Load a long verse: `Romans 8:28-29`
2. Check overlay display

**Expected:**
- ✅ Lines are balanced (similar length)
- ✅ No orphaned words
- ✅ Hyphens appear on long words when needed
- ✅ No awkward mid-sentence breaks
- ✅ `text-wrap: balance` is working

---

## 🎯 Edge Case Tests

### Test 28: Invalid Reference Handling
**Objective:** Handle bad input gracefully

1. Try to fetch: `John 99:99`

**Expected:**
- ✅ Error message displayed
- ✅ No crash
- ✅ Previous verse still accessible

2. Try: `InvalidBook 1:1`

**Expected:**
- ✅ Error: "Verse not found" or similar
- ✅ UI remains functional

### Test 29: Very Long Passage
**Objective:** Handle large content

1. Fetch entire chapter: `Psalm 119`

**Expected:**
- ✅ Splits into multiple slides (likely 15-30)
- ✅ Each slide respects character/line limits
- ✅ Navigate through slides works
- ✅ No performance issues
- ✅ No memory leaks

### Test 30: Special Characters
**Objective:** Handle Unicode properly

1. Fetch verses with special characters
2. Try multiple translations (Hebrew, Greek characters)

**Expected:**
- ✅ All characters display correctly
- ✅ No garbled text
- ✅ No XSS vulnerabilities (HTML is escaped)

---

## ✅ Sign-Off Checklist

After completing all tests above, verify:

### Core Features
- [ ] Single verse fetch works
- [ ] Multi-verse auto-split works correctly
- [ ] All 6 themes render properly
- [ ] All 7 animations work smoothly
- [ ] Ticker scrolls without hitching

### OBS Integration
- [ ] WebSocket connection successful
- [ ] CreateInput adds overlay to all scenes
- [ ] Show/hide overlay works reliably
- [ ] Overlay persists across scene switches
- [ ] Auto-reconnect works

### Mobile & Remote
- [ ] Mobile remote accessible on network
- [ ] QR code works
- [ ] Remote can trigger verses
- [ ] Overlay auto-shows from remote
- [ ] PIN auth works (if enabled)

### Data Persistence
- [ ] History survives restart
- [ ] Favorites persist correctly
- [ ] Service plan saves properly
- [ ] JSON import works
- [ ] CSV import/export works

### Performance
- [ ] Caching improves speed
- [ ] Timeouts prevent hangs
- [ ] OBS reconnection works
- [ ] No memory leaks after 30 min
- [ ] Maintains 30fps consistently

### Accessibility
- [ ] Reduced motion respected
- [ ] Safe area prevents collisions
- [ ] High contrast mode works
- [ ] Text wrapping is balanced
- [ ] All controls keyboard-accessible

### Production Readiness
- [ ] No console errors
- [ ] Graceful error handling
- [ ] Professional appearance
- [ ] Suitable for live use
- [ ] Ready for deployment

---

## 🚀 Ready for Digital Ocean!

Once all tests pass, the application is production-ready for deployment.

**Deployment Checklist:**
- [ ] All smoke tests passed
- [ ] config.json reviewed and configured
- [ ] remotePin set for security
- [ ] OBS connection tested
- [ ] Documentation complete
- [ ] Backup plan created

**Next Steps:**
1. Set up Digital Ocean droplet
2. Install Node.js 18+
3. Clone/upload application
4. Set production config
5. Use PM2 or similar for process management
6. Configure nginx reverse proxy
7. Set up SSL certificate
8. Test from external network
9. Monitor logs and performance
10. Go live! 🎉
