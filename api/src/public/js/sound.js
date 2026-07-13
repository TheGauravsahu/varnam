class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume audio context if suspended (browser security policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('varnam_muted', this.muted);
    return this.muted;
  }

  loadSettings() {
    this.muted = localStorage.getItem('varnam_muted') === 'true';
  }

  playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playCorrect() {
    // Elegant violet chime: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
    this.playTone(523.25, 0.15, 'triangle', 0.12, 0);
    this.playTone(659.25, 0.15, 'triangle', 0.12, 0.08);
    this.playTone(783.99, 0.35, 'triangle', 0.18, 0.16);
  }

  playIncorrect() {
    // Heavy flat thud: 180Hz -> 130Hz
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.25);
    
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.35);
    
    // Connect a lowpass filter to make it warmer/muffled
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playClick() {
    // Short high-quality tactile click
    this.playTone(900, 0.04, 'sine', 0.08);
  }

  playTriumphant() {
    // Level up/Unit Complete: rising major scale chord arpeggios
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.4, 'triangle', 0.1, idx * 0.07);
    });
  }
}

// Instantiate globally
window.Sound = new SoundController();
window.addEventListener('DOMContentLoaded', () => {
  window.Sound.loadSettings();
});
