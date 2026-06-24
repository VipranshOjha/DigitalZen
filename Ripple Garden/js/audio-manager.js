/*
   audio-manager.js
   
   Architecture — three independent layers:
   Layer 1: Ambient Pond (loops forever, 20% vol)
   Layer 2: Ripple Sound (pool of 10 elements, 12% vol)
   Layer 3: Chime Events (random 45–120 s, 10% vol)
   
   Browser unlock:
   All browsers block autoplay until a user gesture. Listen for the first
   click/keydown/touchstart to mark the system as "unlocked". Layers only start after unlock.
   
   Volume architecture:
   Each layer has its own base level that gets multiplied by masterVolume.
*/

class AudioManager {
  constructor() {
    this.enabled = true;
    this.unlocked = false;
    this.masterVolume = 0.25;

    this._BASE_AMBIENT = 0.20;
    this._BASE_RIPPLE = 0.12;
    this._BASE_CHIME = 0.10;

    this._PATHS = {
      ambient: 'assets/audio/freesound_community-calm-pond-bright-wind-in-reeds-geese-water-ttp-190401-55746.mp3',
      ripple: 'assets/audio/soul_serenity_sounds-water-noises-241049.mp3',
      chimes: [
        'assets/audio/freesound_community-wind-chimes-25332.mp3',
        'assets/audio/freesound_community-windchime1-7065.mp3',
      ],
    };

    this._ambient = new Audio();
    this._ambient.src = this._PATHS.ambient;
    this._ambient.loop = true;
    this._ambient.preload = 'none';
    this._ambient.volume = this._effectiveVolume(this._BASE_AMBIENT);

    this._POOL_SIZE = 10;
    this._ripplePool = [];
    this._poolIdx = 0;
    this._RIPPLE_DURATION = 1.8; // max seconds of playback per trigger

    for (let i = 0; i < this._POOL_SIZE; i++) {
      const el = new Audio();
      el.src = this._PATHS.ripple;
      el.preload = 'none';
      el.volume = this._effectiveVolume(this._BASE_RIPPLE);
      this._ripplePool.push(el);
    }

    // Two pre-loaded chime elements (one per file) to avoid allocation per event
    this._chimeEls = this._PATHS.chimes.map(src => {
      const el = new Audio();
      el.src = src;
      el.preload = 'none';
      el.loop = false;
      el.volume = this._effectiveVolume(this._BASE_CHIME);
      return el;
    });
    this._chimeTimer = null;
    this._chimeEnabled = false;

    this._ambientFadeRAF = null;
    this._ambientTarget = 0;

    this._unlockHandler = this._unlock.bind(this);
    ['click', 'touchstart', 'keydown'].forEach(evt =>
      document.addEventListener(evt, this._unlockHandler, { once: false, capture: true, passive: true })
    );
  }

  // Modern browsers require a user gesture before audio plays.
  // We listen on capture phase so we catch the very first event.
  _unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    // Preload ambient now that interaction has happened
    this._ambient.load();
    this._ripplePool.forEach(el => el.load());

    if (this.enabled) {
      this._startAll();
    }

    // Remove listeners — no longer needed
    ['click', 'touchstart', 'keydown'].forEach(evt =>
      document.removeEventListener(evt, this._unlockHandler, { capture: true })
    );
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.unlocked) {
        this._startAll();
      }
    } else {
      this._stopAll();
    }
    return this.enabled;
  }

  _startAll() {
    this._startAmbient();
    this._chimeEnabled = true;
    if (!this._chimeTimer) {
      this._scheduleChime();
    }
  }

  _stopAll() {
    this._fadeAmbient(0, 2000, () => {
      this._ambient.pause();
    });
    this._chimeEnabled = false;
    clearTimeout(this._chimeTimer);
    this._chimeTimer = null;
    // Stop any playing chimes gracefully
    this._chimeEls.forEach(el => {
      if (!el.paused) {
        el.pause();
        el.currentTime = 0;
      }
    });
  }

  _startAmbient() {
    const targetVol = this._effectiveVolume(this._BASE_AMBIENT);

    // Start from 0 and fade in
    this._ambient.volume = 0;
    this._ambientTarget = targetVol;

    const playPromise = this._ambient.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        // Autoplay blocked — will retry on next unlock
        if (this.enabled) {
          console.warn('[RippleGarden Audio] Ambient play blocked:', err.message);
        }
      });
    }

    this._fadeAmbient(targetVol, 2000);
  }

  /**
   * Smooth fade for the ambient layer using requestAnimationFrame.
   * @param {number}   targetVol   0..1
   * @param {number}   durationMs
   * @param {Function} onDone      optional callback
   */
  _fadeAmbient(targetVol, durationMs, onDone) {
    if (this._ambientFadeRAF) cancelAnimationFrame(this._ambientFadeRAF);

    const startVol = this._ambient.volume;
    const startTime = performance.now();
    const delta = targetVol - startVol;

    if (Math.abs(delta) < 0.001) {
      this._ambient.volume = targetVol;
      if (onDone) onDone();
      return;
    }

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-in-out cubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this._ambient.volume = Math.max(0, Math.min(1, startVol + delta * ease));

      if (progress < 1) {
        this._ambientFadeRAF = requestAnimationFrame(tick);
      } else {
        this._ambient.volume = targetVol;
        this._ambientFadeRAF = null;
        if (onDone) onDone();
      }
    };

    this._ambientFadeRAF = requestAnimationFrame(tick);
  }

  // Called by main.js on every click that creates a ripple.
  triggerRippleSound() {
    if (!this.enabled || !this.unlocked) return;

    // Round-robin through the pool
    const el = this._ripplePool[this._poolIdx];
    this._poolIdx = (this._poolIdx + 1) % this._POOL_SIZE;

    // Random start offset 0..0.25 seconds for variation
    const offset = Math.random() * 0.25;

    // Reset and play
    el.pause();
    el.currentTime = offset;
    el.volume = this._effectiveVolume(this._BASE_RIPPLE);

    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => { }); // silently ignore race conditions
    }

    // Auto-stop after RIPPLE_DURATION seconds to avoid long tail
    // We store the timeout on the element itself to cancel if retriggered
    if (el._stopTimeout) clearTimeout(el._stopTimeout);
    el._stopTimeout = setTimeout(() => {
      this._fadeRippleEl(el);
    }, this._RIPPLE_DURATION * 1000);
  }

  /**
   * Quick fade-out for a single ripple pool element.
   * Avoids a hard cut when stopping mid-sample.
   */
  _fadeRippleEl(el) {
    const startVol = el.volume;
    const steps = 10;
    const stepTime = 40; // 10 × 40ms = 400ms fade
    let step = 0;

    const fade = () => {
      step++;
      el.volume = Math.max(0, startVol * (1 - step / steps));
      if (step < steps) {
        setTimeout(fade, stepTime);
      } else {
        el.pause();
        el.volume = this._effectiveVolume(this._BASE_RIPPLE); // restore for next use
      }
    };
    fade();
  }

  _scheduleChime() {
    if (!this._chimeEnabled) return;

    // Random delay between 45 and 120 seconds
    const delay = 45000 + Math.random() * 75000;

    this._chimeTimer = setTimeout(() => {
      if (!this._chimeEnabled || !this.enabled) return;
      this._playChime();
      this._scheduleChime(); // schedule the next one
    }, delay);
  }

  _playChime() {
    // Pick a random chime file
    const el = this._chimeEls[Math.floor(Math.random() * this._chimeEls.length)];

    if (!el.paused) {
      el.pause();
      el.currentTime = 0;
    }

    el.volume = this._effectiveVolume(this._BASE_CHIME);
    el.play().catch(() => { });
  }

  /**
   * Compute effective volume for a layer, applying master multiplier.
   * @param {number} baseLevel  0..1 base level for the layer
   * @returns {number}  clamped 0..1
   */
  _effectiveVolume(baseLevel) {
    return Math.min(1, Math.max(0, baseLevel * this.masterVolume / 0.25));
    // Divide by 0.25 (default master) so the base levels are
    // "what they sound like at 25% master". At 100% master the
    // ambient goes to 80% (0.20 * 4), ripple to 48%, chimes to 40%.
    // This keeps all layers comfortably below clipping at full volume.
  }

  /**
   * Set master volume (0..1) and update all active layers immediately.
   * Called by the volume slider in controls.js.
   * @param {number} v  0..1
   */
  setMasterVolume(v) {
    this.masterVolume = Math.min(1, Math.max(0, v));

    // Update ambient (respects current fade state — only update if playing)
    if (!this._ambient.paused) {
      const target = this._effectiveVolume(this._BASE_AMBIENT);
      // Don't interrupt an active fade — just update the target
      if (this._ambientFadeRAF) {
        this._ambientTarget = target;
      } else {
        this._ambient.volume = target;
      }
    }

    // Update ripple pool volumes
    this._ripplePool.forEach(el => {
      el.volume = this._effectiveVolume(this._BASE_RIPPLE);
    });

    // Update chime volumes
    this._chimeEls.forEach(el => {
      el.volume = this._effectiveVolume(this._BASE_CHIME);
    });
  }

  /**
   * Get current master volume (0..1).
   */
  getMasterVolume() {
    return this.masterVolume;
  }

  isEnabled() { return this.enabled; }
}

window.AudioManager = AudioManager;
