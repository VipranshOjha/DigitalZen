/* ============================================================
   ripple-system.js  (v2 — optimized)
   Key optimizations:
   · Object pool — no per-click allocation
   · RGB cached at spawn time — no per-frame hex parsing
   · shadowBlur eliminated — replaced with wide stroke glow
   · Single ctx.save/restore wrapping entire ripple pass
   · Adaptive quality tiers based on active ripple count
   · Swap-and-pop removal — O(1) instead of O(n) splice
   ============================================================ */

class RippleSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;

    // Active ripples (may come from pool or be freshly created)
    this.ripples = [];

    // Object pool — reuse ripple objects to avoid GC pressure
    this._pool = [];

    // Hard cap — performance safeguard
    this.MAX_RIPPLES = 160;

    // Available ripple color palettes
    this.palettes = {
      aurora:  [
        { hex: '#06b6d4', rgb: '6,182,212'   },
        { hex: '#3b82f6', rgb: '59,130,246'  },
        { hex: '#6366f1', rgb: '99,102,241'  },
        { hex: '#8b5cf6', rgb: '139,92,246'  },
        { hex: '#a855f7', rgb: '168,85,247'  },
        { hex: '#00e5ff', rgb: '0,229,255'   },
      ],
      sunset:  [
        { hex: '#f97316', rgb: '249,115,22'  },
        { hex: '#eab308', rgb: '234,179,8'   },
        { hex: '#ef4444', rgb: '239,68,68'   },
        { hex: '#ec4899', rgb: '236,72,153'  },
        { hex: '#f59e0b', rgb: '245,158,11'  },
        { hex: '#fb923c', rgb: '251,146,60'  },
      ],
      sakura:  [
        { hex: '#f472b6', rgb: '244,114,182' },
        { hex: '#c084fc', rgb: '192,132,252' },
        { hex: '#e879f9', rgb: '232,121,249' },
        { hex: '#f9a8d4', rgb: '249,168,212' },
        { hex: '#fce7f3', rgb: '252,231,243' },
        { hex: '#d8b4fe', rgb: '216,180,254' },
      ],
      emerald: [
        { hex: '#10b981', rgb: '16,185,129'  },
        { hex: '#14b8a6', rgb: '20,184,166'  },
        { hex: '#22d3ee', rgb: '34,211,238'  },
        { hex: '#34d399', rgb: '52,211,153'  },
        { hex: '#6ee7b7', rgb: '110,231,183' },
        { hex: '#2dd4bf', rgb: '45,212,191'  },
      ],
    };

    // Ordered list for cycle support
    this.paletteOrder   = ['aurora', 'sunset', 'sakura', 'emerald'];
    this.currentPalette = 'aurora';

    // Pre-compute max possible radius once and update on resize
    this._maxPossibleR  = 0;
    this._updateMaxR();
  }

  _updateMaxR() {
    this._maxPossibleR = Math.min(
      window.innerWidth,
      window.innerHeight
    ) * 0.42; // upper bound of (0.18 + 0.22) * dimension
  }

  /* ── Palette API ──────────────────────────────────────────── */

  setPalette(name) {
    if (this.palettes[name]) this.currentPalette = name;
  }

  /** Cycle to the next palette in order. Returns new palette name. */
  cyclePalette() {
    const idx  = this.paletteOrder.indexOf(this.currentPalette);
    const next = this.paletteOrder[(idx + 1) % this.paletteOrder.length];
    this.currentPalette = next;
    return next;
  }

  _randomEntry() {
    const palette = this.palettes[this.currentPalette];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  /* ── Object Pool ──────────────────────────────────────────── */

  _acquire() {
    return this._pool.length > 0 ? this._pool.pop() : {};
  }

  _release(r) {
    this._pool.push(r);
  }

  /* ── Public API ───────────────────────────────────────────── */

  /**
   * Spawn a ripple at (x, y). Uses pool to avoid allocation.
   */
  addRipple(x, y) {
    // If at cap, recycle the oldest active ripple immediately
    if (this.ripples.length >= this.MAX_RIPPLES) {
      const evicted = this.ripples.shift(); // remove oldest
      this._release(evicted);
    }

    const entry      = this._randomEntry();
    const shortSide  = Math.min(window.innerWidth, window.innerHeight);
    const maxRadius  = shortSide * (0.18 + Math.random() * 0.22);

    // Get a recycled object or fresh one
    const r     = this._acquire();
    r.x          = x;
    r.y          = y;
    r.radius     = 0;
    r.maxRadius  = maxRadius;
    r.opacity    = 1.0;
    r.rgb        = entry.rgb;          // pre-built "R,G,B" string — no per-frame parsing
    r.speed      = 0.9 + Math.random() * 0.7;
    r.ringCount  = 3 + Math.floor(Math.random() * 2);
    r.ringSpacing = 14 + Math.random() * 10;

    this.ripples.push(r);
  }

  /**
   * Soft-clear: fade remaining ripples then empty the list.
   */
  clear() {
    this.ripples.forEach(r => { r.opacity = Math.min(r.opacity, 0.28); });
    setTimeout(() => {
      this.ripples.forEach(r => this._release(r));
      this.ripples.length = 0;
    }, 380);
  }

  /* ── Update ───────────────────────────────────────────────── */

  update() {
    const ripples = this.ripples;
    let i = ripples.length;

    while (i--) {
      const r        = ripples[i];
      r.radius      += r.speed;
      const progress = r.radius / r.maxRadius; // 0..1

      if (progress > 0.35) {
        r.opacity = Math.max(0, 1 - (progress - 0.35) / 0.65);
      }

      // Dead? — swap-and-pop O(1) removal (order doesn't matter for rendering)
      if (r.radius >= r.maxRadius || r.opacity <= 0.008) {
        this._release(r);
        ripples[i] = ripples[ripples.length - 1];
        ripples.pop();
      }
    }
  }

  /* ── Draw ─────────────────────────────────────────────────── */

  draw() {
    const ctx     = this.ctx;
    const count   = this.ripples.length;
    if (count === 0) return;

    // ── Adaptive quality tiers ─────────────────────────────────
    // Reduce visual complexity proportionally as ripple count grows.
    let maxRings, glowWidth, showBloom;
    if (count < 50) {
      maxRings  = 4;   glowWidth = 28;  showBloom = true;
    } else if (count < 100) {
      maxRings  = 3;   glowWidth = 20;  showBloom = true;
    } else if (count < 130) {
      maxRings  = 2;   glowWidth = 14;  showBloom = false;
    } else {
      maxRings  = 1;   glowWidth = 8;   showBloom = false;
    }

    // Single save/restore for the entire ripple pass
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const W = window.innerWidth;
    const H = window.innerHeight;

    for (let ri = 0; ri < count; ri++) {
      const r         = this.ripples[ri];
      const baseAlpha = r.opacity;
      const rgb       = r.rgb;
      const rings     = Math.min(r.ringCount, maxRings);

      // Skip fully invisible or off-screen ripples (culling)
      if (baseAlpha < 0.01) continue;
      if (r.x + r.radius < 0 || r.x - r.radius > W) continue;
      if (r.y + r.radius < 0 || r.y - r.radius > H) continue;

      const progress = r.radius / r.maxRadius;

      for (let ring = 0; ring < rings; ring++) {
        const ringRadius = r.radius - ring * r.ringSpacing;
        if (ringRadius <= 0) continue;

        const ringAlpha = baseAlpha * (1 - ring * 0.28);
        const lineWidth = Math.max(0.4, 2.5 - ring * 0.7);

        // ── Soft glow: wide low-opacity stroke (no gradient, no shadowBlur) ──
        ctx.beginPath();
        ctx.arc(r.x, r.y, ringRadius, 0, 6.2831853); // 2π pre-computed
        ctx.strokeStyle = `rgba(${rgb},${(ringAlpha * 0.18).toFixed(3)})`;
        ctx.lineWidth   = glowWidth;
        ctx.stroke();

        // ── Crisp ring line ────────────────────────────────────
        ctx.beginPath();
        ctx.arc(r.x, r.y, ringRadius, 0, 6.2831853);
        ctx.strokeStyle = `rgba(${rgb},${(ringAlpha * 0.88).toFixed(3)})`;
        ctx.lineWidth   = lineWidth;
        ctx.stroke();
      }

      // ── Central bloom (birth flash) ────────────────────────
      if (showBloom && progress < 0.25) {
        const bloomAlpha = (1 - progress / 0.25) * baseAlpha * 0.55;
        const bloomSize  = 14 + progress * 30;

        // Bloom: two concentric filled arcs — no gradient objects
        ctx.beginPath();
        ctx.arc(r.x, r.y, bloomSize, 0, 6.2831853);
        ctx.fillStyle = `rgba(255,255,255,${(bloomAlpha * 0.85).toFixed(3)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r.x, r.y, bloomSize * 1.6, 0, 6.2831853);
        ctx.fillStyle = `rgba(${rgb},${(bloomAlpha * 0.28).toFixed(3)})`;
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

window.RippleSystem = RippleSystem;
