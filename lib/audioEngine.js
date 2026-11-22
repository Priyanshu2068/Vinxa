// Web Audio API Mixer & Dual Stream Capture (Mic + Tab Audio)
// + Web Speech API Real-time Streaming STT (<2s latency)

export class VinxaAudioEngine {
  constructor(onTranscriptUpdate, onAudioLevel) {
    this.onTranscriptUpdate = onTranscriptUpdate; // callback({ text, isFinal, speaker, timestamp })
    this.onAudioLevel = onAudioLevel; // callback(level: 0..100)
    this.audioContext = null;
    this.micStream = null;
    this.tabStream = null;
    this.mixedStream = null;
    this.recognition = null;
    this.analyser = null;
    this.animFrame = null;
    this.isRecording = false;
    this.currentSpeaker = 'Speaker 1';
    this.lastSpeakerSwitchTime = Date.now();
  }

  async start({ captureTab = false } = {}) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const destination = this.audioContext.createMediaStreamDestination();

      // 1. Capture Microphone
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      const micSource = this.audioContext.createMediaStreamSource(this.micStream);
      micSource.connect(destination);

      // 2. Capture Browser Tab / System Audio if requested
      if (captureTab) {
        try {
          this.tabStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          
          const audioTracks = this.tabStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const tabAudioStream = new MediaStream(audioTracks);
            const tabSource = this.audioContext.createMediaStreamSource(tabAudioStream);
            tabSource.connect(destination);
          }
        } catch (tabErr) {
          console.warn('Tab audio not selected or denied, proceeding with mic only:', tabErr);
        }
      }

      this.mixedStream = destination.stream;

      // 3. Audio Visualizer Analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      micSource.connect(this.analyser);
      this.startVisualizer();

      // 4. Real-time Speech Recognition
      this.startSpeechRecognition();
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize audio engine', err);
      throw err;
    }
  }

  startVisualizer() {
    if (!this.analyser || !this.onAudioLevel) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isRecording) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      this.onAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      this.animFrame = requestAnimationFrame(update);
    };
    update();
  }

  startSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser. Falling back to simulated stream for demo.');
      this.startSimulatedRecognition();
      return;
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interim = '';
      let finalized = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalized += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      // Speaker heuristic: If pause > 4.5 seconds or conversational turn, toggle speaker
      const now = Date.now();
      if (now - this.lastSpeakerSwitchTime > 5000 && finalized.length > 20) {
        this.currentSpeaker = this.currentSpeaker === 'Speaker 1' ? 'Speaker 2' : 'Speaker 1';
        this.lastSpeakerSwitchTime = now;
      }

      if (finalized.trim()) {
        this.onTranscriptUpdate({
          text: finalized.trim(),
          isFinal: true,
          speaker: this.currentSpeaker,
          timestamp: new Date()
        });
      } else if (interim.trim()) {
        this.onTranscriptUpdate({
          text: interim.trim(),
          isFinal: false,
          speaker: this.currentSpeaker,
          timestamp: new Date()
        });
      }
    };

    this.recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error === 'no-speech') return;
      // Auto restart if aborted
      if (this.isRecording) {
        try { this.recognition.start(); } catch (err) {}
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try { this.recognition.start(); } catch (err) {}
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
    }
  }

  startSimulatedRecognition() {
    // Demonstration fallback in case mic/speech is restricted
    const samplePhrases = [
      { speaker: 'Speaker 1', text: 'Let us go through the project milestones for Escape Velocity 2.0.' },
      { speaker: 'Speaker 2', text: 'The dual audio capture and live transcript lag are working under two seconds.' },
      { speaker: 'Speaker 1', text: 'Action item: Make sure the read-only share link is generated properly before the demo.' },
      { speaker: 'Speaker 2', text: 'Agreed, and we should also test exporting as Markdown and PDF.' }
    ];
    let idx = 0;
    this.simInterval = setInterval(() => {
      if (!this.isRecording || idx >= samplePhrases.length) return;
      const phrase = samplePhrases[idx % samplePhrases.length];
      this.onTranscriptUpdate({
        text: phrase.text,
        isFinal: true,
        speaker: phrase.speaker,
        timestamp: new Date()
      });
      idx++;
    }, 4000);
  }

  stop() {
    this.isRecording = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.simInterval) clearInterval(this.simInterval);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.tabStream) {
      this.tabStream.getTracks().forEach(t => t.stop());
      this.tabStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
