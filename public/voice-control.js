// PrimeBible Voice Control - Combined Version
// Contains both VoiceVerseDetector and VoiceControlUI in a single file

// ============================================================================
// VOICE VERSE DETECTOR - Speech recognition and verse parsing
// ============================================================================

class VoiceVerseDetector {
  constructor(onVerseDetected) {
    this.onVerseDetected = onVerseDetected;
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }
  
  setupRecognition() {
    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Handle results
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update transcript
      this.transcript = (finalTranscript + interimTranscript).trim();
      
      // Try to detect verse reference if we have a final result
      if (finalTranscript) {
        this.detectVerseReference(finalTranscript);
      }
      
      // Notify listeners of transcript update
      this.onTranscriptUpdate?.(this.transcript, !finalTranscript);
    };
    
    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Automatically restart if no speech detected
        if (this.isListening) {
          setTimeout(() => this.start(), 100);
        }
      }
    };
    
    // Handle end
    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if we're supposed to be listening
        setTimeout(() => this.start(), 100);
      }
    };
  }
  
  start() {
    if (!this.recognition) return false;
    
    try {
      this.recognition.start();
      this.isListening = true;
      this.transcript = '';
      return true;
    } catch (e) {
      console.error('Failed to start recognition:', e);
      return false;
    }
  }
  
  stop() {
    if (!this.recognition) return;
    
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (e) {
      console.error('Failed to stop recognition:', e);
    }
  }
  
  detectVerseReference(text) {
    const verses = this.parseVerseReferences(text.toLowerCase());
    
    if (verses.length > 0) {
      // Found verse references!
      verses.forEach(verse => {
        console.log('Detected verse:', verse);
        this.onVerseDetected?.(verse);
      });
    }
  }
  
  parseVerseReferences(text) {
    const references = [];
    
    // Bible books mapping (handle variations)
    const books = {
      // Old Testament
      'genesis': 'Genesis', 'gen': 'Genesis',
      'exodus': 'Exodus', 'ex': 'Exodus', 'exo': 'Exodus',
      'leviticus': 'Leviticus', 'lev': 'Leviticus',
      'numbers': 'Numbers', 'num': 'Numbers',
      'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'deu': 'Deuteronomy',
      'joshua': 'Joshua', 'josh': 'Joshua', 'jos': 'Joshua',
      'judges': 'Judges', 'judg': 'Judges',
      'ruth': 'Ruth',
      '1 samuel': '1 Samuel', 'first samuel': '1 Samuel', '1samuel': '1 Samuel', '1sam': '1 Samuel',
      '2 samuel': '2 Samuel', 'second samuel': '2 Samuel', '2samuel': '2 Samuel', '2sam': '2 Samuel',
      '1 kings': '1 Kings', 'first kings': '1 Kings', '1kings': '1 Kings',
      '2 kings': '2 Kings', 'second kings': '2 Kings', '2kings': '2 Kings',
      '1 chronicles': '1 Chronicles', 'first chronicles': '1 Chronicles', '1chron': '1 Chronicles',
      '2 chronicles': '2 Chronicles', 'second chronicles': '2 Chronicles', '2chron': '2 Chronicles',
      'ezra': 'Ezra',
      'nehemiah': 'Nehemiah', 'neh': 'Nehemiah',
      'esther': 'Esther', 'est': 'Esther',
      'job': 'Job',
      'psalm': 'Psalms', 'psalms': 'Psalms', 'ps': 'Psalms',
      'proverbs': 'Proverbs', 'prov': 'Proverbs',
      'ecclesiastes': 'Ecclesiastes', 'eccl': 'Ecclesiastes',
      'song of solomon': 'Song of Solomon', 'songs': 'Song of Solomon', 'song': 'Song of Solomon',
      'isaiah': 'Isaiah', 'isa': 'Isaiah',
      'jeremiah': 'Jeremiah', 'jer': 'Jeremiah',
      'lamentations': 'Lamentations', 'lam': 'Lamentations',
      'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel',
      'daniel': 'Daniel', 'dan': 'Daniel',
      'hosea': 'Hosea', 'hos': 'Hosea',
      'joel': 'Joel',
      'amos': 'Amos',
      'obadiah': 'Obadiah', 'obad': 'Obadiah',
      'jonah': 'Jonah',
      'micah': 'Micah', 'mic': 'Micah',
      'nahum': 'Nahum', 'nah': 'Nahum',
      'habakkuk': 'Habakkuk', 'hab': 'Habakkuk',
      'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah',
      'haggai': 'Haggai', 'hag': 'Haggai',
      'zechariah': 'Zechariah', 'zech': 'Zechariah',
      'malachi': 'Malachi', 'mal': 'Malachi',
      
      // New Testament
      'matthew': 'Matthew', 'matt': 'Matthew', 'mat': 'Matthew',
      'mark': 'Mark',
      'luke': 'Luke',
      'john': 'John',
      'acts': 'Acts',
      'romans': 'Romans', 'rom': 'Romans',
      '1 corinthians': '1 Corinthians', 'first corinthians': '1 Corinthians', '1cor': '1 Corinthians',
      '2 corinthians': '2 Corinthians', 'second corinthians': '2 Corinthians', '2cor': '2 Corinthians',
      'galatians': 'Galatians', 'gal': 'Galatians',
      'ephesians': 'Ephesians', 'eph': 'Ephesians',
      'philippians': 'Philippians', 'phil': 'Philippians',
      'colossians': 'Colossians', 'col': 'Colossians',
      '1 thessalonians': '1 Thessalonians', 'first thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians',
      '2 thessalonians': '2 Thessalonians', 'second thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians',
      '1 timothy': '1 Timothy', 'first timothy': '1 Timothy', '1tim': '1 Timothy',
      '2 timothy': '2 Timothy', 'second timothy': '2 Timothy', '2tim': '2 Timothy',
      'titus': 'Titus',
      'philemon': 'Philemon', 'philem': 'Philemon',
      'hebrews': 'Hebrews', 'heb': 'Hebrews',
      'james': 'James', 'jam': 'James',
      '1 peter': '1 Peter', 'first peter': '1 Peter', '1pet': '1 Peter',
      '2 peter': '2 Peter', 'second peter': '2 Peter', '2pet': '2 Peter',
      '1 john': '1 John', 'first john': '1 John', '1jn': '1 John',
      '2 john': '2 John', 'second john': '2 John', '2jn': '2 John',
      '3 john': '3 John', 'third john': '3 John', '3jn': '3 John',
      'jude': 'Jude',
      'revelation': 'Revelation', 'rev': 'Revelation'
    };
    
    // Convert number words to digits
    text = text.replace(/\bfirst\b/g, '1');
    text = text.replace(/\bsecond\b/g, '2');
    text = text.replace(/\bthird\b/g, '3');
    
    // Pattern 1: "Book Chapter:Verse" (e.g., "john 3:16", "romans 8:28")
    const pattern1 = /\b([123]?\s*[a-z]+)\s+(\d+)\s*:?\s*(\d+)(?:\s*(?:to|through|thru|-)\s*(\d+))?\b/gi;
    let match;
    
    while ((match = pattern1.exec(text)) !== null) {
      const bookName = match[1].trim();
      const chapter = match[2];
      const verseStart = match[3];
      const verseEnd = match[4];
      
      // Check if it's a valid book
      const normalizedBook = books[bookName.toLowerCase()];
      if (normalizedBook) {
        references.push({
          book: normalizedBook,
          chapter: parseInt(chapter),
          verseStart: parseInt(verseStart),
          verseEnd: verseEnd ? parseInt(verseEnd) : parseInt(verseStart)
        });
      }
    }
    
    // Pattern 2: "Book chapter X verse Y" (more natural speech)
    const pattern2 = /\b([123]?\s*[a-z]+)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through|thru)\s+(?:verse\s+)?(\d+))?\b/gi;
    
    while ((match = pattern2.exec(text)) !== null) {
      const bookName = match[1].trim();
      const chapter = match[2];
      const verseStart = match[3];
      const verseEnd = match[4];
      
      const normalizedBook = books[bookName.toLowerCase()];
      if (normalizedBook) {
        references.push({
          book: normalizedBook,
          chapter: parseInt(chapter),
          verseStart: parseInt(verseStart),
          verseEnd: verseEnd ? parseInt(verseEnd) : parseInt(verseStart)
        });
      }
    }
    
    return references;
  }
  
  // Format verse reference for display
  formatReference(verse) {
    if (verse.verseStart === verse.verseEnd) {
      return `${verse.book} ${verse.chapter}:${verse.verseStart}`;
    } else {
      return `${verse.book} ${verse.chapter}:${verse.verseStart}-${verse.verseEnd}`;
    }
  }
}

// ============================================================================
// VOICE CONTROL UI - User interface component
// ============================================================================

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

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.VoiceVerseDetector = VoiceVerseDetector;
  window.VoiceControlUI = VoiceControlUI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceVerseDetector, VoiceControlUI };
}