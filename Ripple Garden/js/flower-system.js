/* ============================================================
   flower-system.js
   Decorative lotus flowers that drift slowly and bob gently.
   Rendered procedurally — no images required.
   ============================================================ */

class FlowerSystem {
  constructor(canvas, ctx) {
    this.canvas  = canvas;
    this.ctx     = ctx;
    this.flowers = [];
    this.COUNT   = 4; // 3–6 flowers
    this.colors  = ['#f472b6', '#e879f9', '#f9a8d4', '#c084fc'];
  }

  setColors(colors) {
    this.colors = colors;
    this.flowers.forEach((f, i) => {
      f.color = colors[i % colors.length];
    });
  }

  _createFlower(index) {
    // Use logical (CSS) pixel dimensions, not DPR-scaled canvas dimensions
    const w   = window.innerWidth;
    const h   = window.innerHeight;
    const pad = 80;

    return {
      x:         pad + Math.random() * (w - pad * 2),
      y:         pad + Math.random() * (h - pad * 2),
      vx:        (Math.random() - 0.5) * 0.12,
      vy:        (Math.random() - 0.5) * 0.08,
      bobPhase:  Math.random() * Math.PI * 2,
      bobSpeed:  0.008 + Math.random() * 0.006,
      bobAmp:    2.5 + Math.random() * 2,
      rotation:  Math.random() * Math.PI * 2,
      rotSpeed:  (Math.random() - 0.5) * 0.003,
      size:      22 + Math.random() * 16,
      color:     this.colors[index % this.colors.length],
      opacity:   0.82 + Math.random() * 0.15,
      glowSize:  0,
      glowDir:   1,
    };
  }

  init() {
    this.flowers = [];
    for (let i = 0; i < this.COUNT; i++) {
      this.flowers.push(this._createFlower(i));
    }
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.flowers.forEach(f => {
      f.x = Math.max(60, Math.min(w - 60, f.x));
      f.y = Math.max(60, Math.min(h - 60, f.y));
    });
  }

  update() {
    const w   = window.innerWidth;
    const h   = window.innerHeight;
    const pad = 50;

    this.flowers.forEach(f => {
      // Drift
      f.x += f.vx;
      f.y += f.vy;

      // Soft bounce at edges
      if (f.x < pad || f.x > w - pad) { f.vx *= -1; f.x = Math.max(pad, Math.min(w - pad, f.x)); }
      if (f.y < pad || f.y > h - pad) { f.vy *= -1; f.y = Math.max(pad, Math.min(h - pad, f.y)); }

      // Bob
      f.bobPhase += f.bobSpeed;

      // Slow rotation
      f.rotation += f.rotSpeed;

      // Breathing glow
      f.glowSize += f.glowDir * 0.05;
      if (f.glowSize > 1) f.glowDir = -1;
      if (f.glowSize < 0) f.glowDir =  1;
    });
  }

  /**
   * Draw a single lotus flower procedurally.
   * Composed of: lily pad, outer petals, inner petals, center.
   */
  _drawFlower(f) {
    const ctx = this.ctx;
    const bobY = Math.sin(f.bobPhase) * f.bobAmp;
    const cx   = f.x;
    const cy   = f.y + bobY;
    const s    = f.size;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.rotation);
    ctx.globalAlpha = f.opacity;

    // ── Lily pad ──────────────────────────────────────────────
    const padR = s * 1.45;
    const padGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, padR);
    padGrad.addColorStop(0, 'rgba(34,197,94,0.30)');
    padGrad.addColorStop(0.6, 'rgba(22,163,74,0.22)');
    padGrad.addColorStop(1, 'rgba(15,118,54,0.08)');

    ctx.beginPath();
    // Full circle with a notch cut out (pac-man style)
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, padR, 0.18, Math.PI * 2 - 0.18);
    ctx.closePath();
    ctx.fillStyle = padGrad;
    ctx.fill();

    // Pad vein lines
    ctx.globalAlpha = f.opacity * 0.35;
    for (let v = 0; v < 6; v++) {
      const ang = (v / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * padR * 0.95, Math.sin(ang) * padR * 0.95);
      ctx.strokeStyle = 'rgba(134,239,172,0.6)';
      ctx.lineWidth   = 0.7;
      ctx.stroke();
    }
    ctx.globalAlpha = f.opacity;

    // ── Outer petals ──────────────────────────────────────────
    const OUTER = 8;
    for (let i = 0; i < OUTER; i++) {
      const ang = (i / OUTER) * Math.PI * 2;
      ctx.save();
      ctx.rotate(ang);

      const petalGrad = ctx.createLinearGradient(0, -s * 0.2, 0, -s * 1.15);
      petalGrad.addColorStop(0, `rgba(255,255,255,0.5)`);
      petalGrad.addColorStop(0.4, f.color + 'cc');
      petalGrad.addColorStop(1, f.color + '66');

      ctx.beginPath();
      ctx.moveTo(0, -s * 0.18);
      ctx.bezierCurveTo( s * 0.35, -s * 0.55,  s * 0.28, -s * 1.05,  0, -s * 1.12);
      ctx.bezierCurveTo(-s * 0.28, -s * 1.05, -s * 0.35, -s * 0.55,  0, -s * 0.18);
      ctx.closePath();

      ctx.fillStyle   = petalGrad;
      ctx.shadowColor = f.color;
      ctx.shadowBlur  = 8 + f.glowSize * 5;
      ctx.fill();
      ctx.restore();
    }

    // ── Inner petals ──────────────────────────────────────────
    const INNER = 5;
    for (let i = 0; i < INNER; i++) {
      const ang = (i / INNER) * Math.PI * 2 + Math.PI / INNER;
      ctx.save();
      ctx.rotate(ang);

      const innerGrad = ctx.createLinearGradient(0, -s * 0.1, 0, -s * 0.72);
      innerGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
      innerGrad.addColorStop(0.5, f.color + 'ee');
      innerGrad.addColorStop(1, f.color + '99');

      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.bezierCurveTo( s * 0.22, -s * 0.38,  s * 0.18, -s * 0.7,  0, -s * 0.74);
      ctx.bezierCurveTo(-s * 0.18, -s * 0.7,  -s * 0.22, -s * 0.38,  0, -s * 0.1);
      ctx.closePath();

      ctx.fillStyle   = innerGrad;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur  = 4;
      ctx.fill();
      ctx.restore();
    }

    // ── Center stamen ─────────────────────────────────────────
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.28);
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(0.5, '#fde68a');
    centerGrad.addColorStop(1, '#f59e0b66');

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.fillStyle   = centerGrad;
    ctx.shadowColor = '#fde68a';
    ctx.shadowBlur  = 12 + f.glowSize * 8;
    ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.restore();
  }

  draw() {
    this.flowers.forEach(f => this._drawFlower(f));
  }
}

window.FlowerSystem = FlowerSystem;
