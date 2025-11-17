// Voice Control UI Component for PrimeBible Control Panel
// Add this to your control panel HTML/JS

class VoiceControlUI {
  constructor(containerId, onVerseRequest) {
    this.container = document.getElementById(containerId);
    this.onVerseRequest = onVerseRequest;
    this.detector = null;
    this.isListening = false;
    
    this.init();
  }
  
  init() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.showUnsupportedMessage();
      return;
    }
    
    this.buildUI();
    this.setupVoiceDetector();
  }
  
  buildUI() {
    const html = `
      <div class="voice-control-panel" style="
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <button id="voiceToggle" class="voice-toggle-btn" style="
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          ">
            <span class="voice-icon">🎤</span>
            <span class="voice-text">Start Listening</span>
          </button>
          
          <div class="voice-status" style="
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
          ">
            <span id="voiceStatus">Ready</span>
          </div>
        </div>
        
        <div id="voiceTranscript" style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          min-height: 60px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.6;
          font-family: monospace;
          display: none;
        ">
          <div style="opacity: 0.5; font-size: 12px; margin-bottom: 4px;">Listening...</div>
          <div id="transcriptText" style="color: #60a5fa;"></div>
        </div>
        
        <div id="detectedVerses" style="
          margin-top: 12px;
          display: none;
        "></div>
        
        <div style="
          margin-top: 12px;
          padding: 12px;
          background: rgba(96, 165, 250, 0.1);
          border-radius: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        ">
          <strong style="color: #60a5fa;">💡 Examples:</strong><br>
          • "John 3:16"<br>
          • "Romans chapter 8 verse 28"<br>
          • "Psalm 23 verses 1 to 6"<br>
          • "First Corinthians 13:4"
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Get elements
    this.toggleBtn = document.getElementById('voiceToggle');
    this.statusEl = document.getElementById('voiceStatus');
    this.transcriptEl = document.getElementById('voiceTranscript');
    this.transcriptText = document.getElementById('transcriptText');
    this.detectedVersesEl = document.getElementById('detectedVerses');
    
    // Setup event listeners
    this.toggleBtn.addEventListener('click', () => this.toggleListening());
    
    // Style hover effects
    this.toggleBtn.addEventListener('mouseenter', () => {
      if (!this.isListening) {
        this.toggleBtn.style.background = '#2563eb';
        this.toggleBtn.style.transform = 'scale(1.05)';
      }
    });
    
    this.toggleBtn.addEventListener('mouseleave', () => {
      if (!this.isListening) {
        this.toggleBtn.style.background = '#3b82f6';
        this.toggleBtn.style.transform = 'scale(1)';
      }
    });
  }
  
  setupVoiceDetector() {
    this.detector = new VoiceVerseDetector((verse) => {
      this.handleVerseDetected(verse);
    });
    
    // Add transcript update handler
    this.detector.onTranscriptUpdate = (text, isInterim) => {
      this.updateTranscript(text, isInterim);
    };
  }
  
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
  
  startListening() {
    const success = this.detector.start();
    
    if (success) {
      this.isListening = true;
      this.toggleBtn.querySelector('.voice-icon').textContent = '⏹️';
      this.toggleBtn.querySelector('.voice-text').textContent = 'Stop Listening';
      this.toggleBtn.style.background = '#ef4444';
      this.statusEl.textContent = 'Listening...';
      this.statusEl.style.color = '#60a5fa';
      this.transcriptEl.style.display = 'block';
      
      // Add pulse animation
      this.toggleBtn.style.animation = 'pulse 2s infinite';
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
      `;
      document.head.appendChild(style);
    } else {
      this.statusEl.textContent = 'Failed to start';
      this.statusEl.style.color = '#ef4444';
    }
  }
  
  stopListening() {
    this.detector.stop();
    this.isListening = false;
    this.toggleBtn.querySelector('.voice-icon').textContent = '🎤';
    this.toggleBtn.querySelector('.voice-text').textContent = 'Start Listening';
    this.toggleBtn.style.background = '#3b82f6';
    this.toggleBtn.style.animation = 'none';
    this.statusEl.textContent = 'Ready';
    this.statusEl.style.color = 'rgba(255, 255, 255, 0.7)';
    this.transcriptEl.style.display = 'none';
  }
  
  updateTranscript(text, isInterim) {
    if (text) {
      this.transcriptText.textContent = text;
      if (isInterim) {
        this.transcriptText.style.opacity = '0.6';
      } else {
        this.transcriptText.style.opacity = '1';
      }
    }
  }
  
  handleVerseDetected(verse) {
    const reference = this.detector.formatReference(verse);
    
    // Show detected verse
    this.showDetectedVerse(reference);
    
    // Call the callback to fetch and display the verse
    if (this.onVerseRequest) {
      this.onVerseRequest(verse);
    }
    
    // Optional: Stop listening after detection
    // this.stopListening();
  }
  
  showDetectedVerse(reference) {
    const verseEl = document.createElement('div');
    verseEl.style.cssText = `
      padding: 12px;
      background: rgba(96, 165, 250, 0.2);
      border: 1px solid rgba(96, 165, 250, 0.4);
      border-radius: 8px;
      margin-top: 8px;
      color: white;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideIn 0.3s ease;
    `;
    
    verseEl.innerHTML = `
      <span style="font-size: 20px;">✓</span>
      <span>Detected: ${reference}</span>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    this.detectedVersesEl.style.display = 'block';
    this.detectedVersesEl.appendChild(verseEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      verseEl.style.transition = 'opacity 0.3s';
      verseEl.style.opacity = '0';
      setTimeout(() => verseEl.remove(), 300);
    }, 3000);
  }
  
  showUnsupportedMessage() {
    this.container.innerHTML = `
      <div style="
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        padding: 16px;
        color: #fca5a5;
        text-align: center;
      ">
        <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
        <div style="font-weight: 600; margin-bottom: 8px;">Voice Control Not Supported</div>
        <div style="font-size: 14px; opacity: 0.8;">
          Your browser doesn't support speech recognition.<br>
          Try Chrome, Edge, or Safari.
        </div>
      </div>
    `;
  }
}

// Usage example:
// const voiceControl = new VoiceControlUI('voiceControlContainer', (verse) => {
//   // Handle verse request - fetch from API and display
//   console.log('Fetch verse:', verse);
//   fetchAndDisplayVerse(verse.book, verse.chapter, verse.verseStart, verse.verseEnd);
// });