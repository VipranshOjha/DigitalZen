/* ============================================================
   main.js
   Application entry point — bootstraps all systems and runs
   the main animation loop.
   ============================================================ */

(function () {
  'use strict';

  /* ── Canvas Setup ─────────────────────────────────────────── */
  const canvas = document.getElementById('garden-canvas');
  const ctx    = canvas.getContext('2d');

  /** Track device pixel ratio for crisp rendering on HiDPI displays */
  let DPR = window.devicePixelRatio || 1;

  function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width  = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Notify systems that canvas has changed size
    if (window.Garden) {
      Garden.particles.resize();
      Garden.flowers.resize();
      _buildBackgroundCache();
    }
  }

  /* ── Background Cache ─────────────────────────────────────── */
  // We pre-render the background onto an offscreen canvas for performance.
  let bgCache       = null;
  let bgCacheWidth  = 0;
  let bgCacheHeight = 0;
  let _bgDirty      = true;

  function _buildBackgroundCache() {
    // Guard: Garden must be initialized before we can read theme data
    if (!window.Garden) return;
    const theme = Garden.theme.theme;
    const w     = window.innerWidth;
    const h     = window.innerHeight;

    if (w === bgCacheWidth && h === bgCacheHeight && !_bgDirty) return;

    bgCacheWidth  = w;
    bgCacheHeight = h;
    _bgDirty      = false;

    const off    = document.createElement('canvas');
    off.width    = Math.round(w * DPR);
    off.height   = Math.round(h * DPR);
    const offCtx = off.getContext('2d');
    offCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    _drawBackground(offCtx, theme, w, h);
    bgCache = off;
  }

  function _drawBackground(ctx, theme, w, h) {
    // Main radial gradient (deep center, lighter edges = depth)
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    const stops = theme.gradient;
    stops.forEach(s => grad.addColorStop(s.stop, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal shimmer bands (water texture feeling)
    const shimmerCount = 18;
    for (let i = 0; i < shimmerCount; i++) {
      const y    = (i / shimmerCount) * h;
      const sinV = Math.sin(i * 1.37) * 0.5 + 0.5; // 0..1
      const grd  = ctx.createLinearGradient(0, y, w, y);
      grd.addColorStop(0,   'rgba(255,255,255,0)');
      grd.addColorStop(0.3 + sinV * 0.4, theme.shimmerColor);
      grd.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, y, w, h / shimmerCount * 1.4);
    }

    // Noise-like texture dots (very subtle)
    ctx.save();
    ctx.globalAlpha = 0.018;
    for (let i = 0; i < 120; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const nr = 0.5 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();

    // Radial vignette overlay
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, theme.vignetteColor);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  /* ── Systems Initialization ───────────────────────────────── */
  const themeManager     = new ThemeManager();
  const rippleSystem     = new RippleSystem(canvas, ctx);
  const particleSystem   = new ParticleSystem(canvas, ctx);
  const flowerSystem     = new FlowerSystem(canvas, ctx);
  const audioManager     = new AudioManager();
  const screenshotMgr    = new ScreenshotManager(canvas);

  // Toast notification helper
  let _toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  const controls = new Controls({
    themeManager,
    rippleSystem,
    audioManager,
    screenshotManager: screenshotMgr,
    toastFn: showToast,
  });

  // Expose global Garden namespace so controls.js can access systems
  window.Garden = {
    theme:      themeManager,
    ripples:    rippleSystem,
    particles:  particleSystem,
    flowers:    flowerSystem,
    audio:      audioManager,
    screenshot: screenshotMgr,
    controls,
    toast:      showToast,
  };

  /* ── Theme Change Listener ────────────────────────────────── */
  document.addEventListener('themechange', (e) => {
    const theme = e.detail.theme;
    particleSystem.setColors(theme.petalColors);
    flowerSystem.setColors(theme.flowerColors);
    _bgDirty = true;
    _buildBackgroundCache();
  });

  /* ── Input — Click & Touch ────────────────────────────────── */

  // Idle mode: timestamp of the most recent user interaction (ms)
  let _lastInteraction = performance.now();

  function _resetIdleClock() {
    _lastInteraction = performance.now();
  }

  function handleInteraction(e) {
    // Ignore clicks on UI elements
    if (e.target !== canvas) return;

    _resetIdleClock();

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches) {
      // Touch event
      const t = e.touches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    rippleSystem.addRipple(x, y);

    // Layer 2: trigger ripple water sound (AudioManager guards enabled/unlocked)
    audioManager.triggerRippleSound();
  }

  canvas.addEventListener('click',      handleInteraction);
  canvas.addEventListener('touchstart', handleInteraction, { passive: true });

  // Optional: drag to create ripples (debounced)
  let _dragThrottle = 0;
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1) return;           // only while dragging (LMB held)
    if (e.target !== canvas) return;
    const now = performance.now();
    if (now - _dragThrottle < 80) return;  // max ~12 ripples/sec during drag
    _dragThrottle = now;

    _resetIdleClock();

    const rect = canvas.getBoundingClientRect();
    rippleSystem.addRipple(e.clientX - rect.left, e.clientY - rect.top);

    // Layer 2: ripple sound on drag (throttled to match ripple rate)
    audioManager.triggerRippleSound();
  });

  /* ── Idle Mode ─────────────────────────────────────────────── */
  //
  // After IDLE_ONSET ms of no interaction the pond gently breathes:
  // a single quiet ripple appears every IDLE_INTERVAL_MIN..MAX ms.
  // The clock resets the moment the user touches anything.
  //
  const IDLE_ONSET        = 30000 + Math.random() * 30000; // 30–60 s
  const IDLE_INTERVAL_MIN =  8000; // 8 s minimum gap between idle ripples
  const IDLE_INTERVAL_MAX = 18000; // 18 s maximum gap

  function _spawnIdleRipple() {
    const idle = performance.now() - _lastInteraction;

    if (idle >= IDLE_ONSET) {
      // Choose a position that feels organic — weighted toward the calm
      // centre of the pond rather than the very edges.
      const w  = window.innerWidth;
      const h  = window.innerHeight;

      // Random point inside a soft inner ellipse (60–80% of the viewport)
      const angle = Math.random() * Math.PI * 2;
      const rx    = w * (0.28 + Math.random() * 0.22); // 28–50% half-width
      const ry    = h * (0.22 + Math.random() * 0.18); // 22–40% half-height
      const cx    = w * 0.5;
      const cy    = h * 0.52; // slightly below centre — like a real pond

      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle) * ry;

      rippleSystem.addRipple(x, y);
      // No sound for idle ripples — keeps the atmosphere natural and quiet
    }

    // Always re-schedule; the next call re-checks idle time itself
    const nextIn = IDLE_INTERVAL_MIN +
                   Math.random() * (IDLE_INTERVAL_MAX - IDLE_INTERVAL_MIN);
    setTimeout(_spawnIdleRipple, nextIn);
  }

  /* ── Main Animation Loop ──────────────────────────────────── */
  let lastTime = 0;

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // ── 1. Draw background ────────────────────────────────────
    if (bgCache) {
      ctx.drawImage(bgCache, 0, 0, w, h);
    } else {
      ctx.fillStyle = themeManager.theme.gradient[0].color;
      ctx.fillRect(0, 0, w, h);
    }

    // ── 2. Animate subtle background sparkles ─────────────────
    _drawSparkles(ctx, w, h, timestamp);

    // ── 3. Update & draw flowers (below petals & ripples) ─────
    flowerSystem.update();
    flowerSystem.draw();

    // ── 4. Update & draw ripples ──────────────────────────────
    rippleSystem.update();
    rippleSystem.draw();

    // ── 5. Update & draw petals (on top of ripples) ───────────
    particleSystem.update();
    particleSystem.draw();

    // ── 6. FPS counter (dev, hidden) ─────────────────────────
    // Uncomment to debug: _drawFPS(ctx, dt);

    requestAnimationFrame(loop);
  }

  /* ── Sparkle Layer ────────────────────────────────────────── */
  // Pre-generate sparkle positions once
  const SPARKLES = Array.from({ length: 55 }, () => ({
    x:     Math.random(),    // normalized 0..1
    y:     Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: 0.0008 + Math.random() * 0.001,
    size:  0.5 + Math.random() * 1.2,
  }));

  /**
   * Batch-draw sparkles by grouping into ~8 opacity buckets.
   * Reduces from 55 individual fill() calls to ~8 per frame.
   */
  function _drawSparkles(ctx, w, h, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = '#ffffff';

    // Group sparkles into 8 alpha buckets (0–7 → alpha 0..0.35)
    const BUCKETS  = 8;
    const buckets  = new Array(BUCKETS);
    for (let b = 0; b < BUCKETS; b++) buckets[b] = [];

    SPARKLES.forEach(s => {
      const rawAlpha = (Math.sin(t * s.speed * 1000 + s.phase) * 0.5 + 0.5) * 0.35;
      const bucket   = Math.min(BUCKETS - 1, Math.floor(rawAlpha / 0.35 * BUCKETS));
      buckets[bucket].push(s);
    });

    for (let b = 0; b < BUCKETS; b++) {
      const group = buckets[b];
      if (group.length === 0) continue;

      ctx.globalAlpha = (b + 0.5) / BUCKETS * 0.35;
      ctx.beginPath();
      group.forEach(s => {
        // Use rect() for tiny sparkles — faster than arc() for sub-2px dots
        const sz = s.size;
        const sx = s.x * w;
        const sy = s.y * h;
        if (sz < 1) {
          ctx.rect(sx - sz, sy - sz, sz * 2, sz * 2);
        } else {
          ctx.moveTo(sx + sz, sy);
          ctx.arc(sx, sy, sz, 0, 6.2831853);
        }
      });
      ctx.fill();
    }

    ctx.restore();
  }

  /* ── Optional FPS Debug ───────────────────────────────────── */
  // function _drawFPS(ctx, dt) {
  //   ctx.save();
  //   ctx.globalAlpha = 0.6;
  //   ctx.fillStyle = '#fff';
  //   ctx.font = '12px monospace';
  //   ctx.fillText(`${Math.round(1000 / dt)} fps | ${rippleSystem.ripples.length} ripples`, 12, 22);
  //   ctx.restore();
  // }

  /* ── Boot ─────────────────────────────────────────────────── */
  function init() {
    resizeCanvas();
    _buildBackgroundCache();

    particleSystem.setColors(themeManager.theme.petalColors);
    flowerSystem.setColors(themeManager.theme.flowerColors);
    particleSystem.init();
    flowerSystem.init();

    // Seed a few ripples on load for immediate visual delight
    setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const seedPoints = [
        [w * 0.35, h * 0.45],
        [w * 0.62, h * 0.38],
        [w * 0.50, h * 0.60],
      ];
      seedPoints.forEach(([x, y]) => rippleSystem.addRipple(x, y));
    }, 300);

    requestAnimationFrame(loop);

    // Start idle ripple scheduler — first check after the shortest possible
    // idle interval, so the first natural ripple can appear ~8–18 s after
    // the onset threshold is crossed.
    setTimeout(_spawnIdleRipple, IDLE_INTERVAL_MIN + Math.random() * (IDLE_INTERVAL_MAX - IDLE_INTERVAL_MIN));
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    _bgDirty = true;
    _buildBackgroundCache();
  });

  // Start
  init();

})();
