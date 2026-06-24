/*
   particle-system.js
   Floating lotus petal particles that drift gently across
   the screen with organic movement and screen wrapping.
*/

class ParticleSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this.petals = [];
    this.TARGET_COUNT = 35;
    this.petalColors  = ['#f9a8d4', '#f472b6', '#e879f9', '#c084fc', '#fda4af'];
  }

  setColors(colors) {
    this.petalColors = colors;
    // Gently recolor existing petals
    this.petals.forEach(p => {
      p.color = colors[Math.floor(Math.random() * colors.length)];
    });
  }

  /**
   * Create a single petal, optionally at a specific location.
   * @param {boolean} randomY  If true place anywhere on screen (init), else spawn at top
   */
  _createPetal(randomY = false) {
    // Use logical (CSS) pixel dimensions, not DPR-scaled canvas dimensions
    const w     = window.innerWidth;
    const h     = window.innerHeight;
    const color = this.petalColors[Math.floor(Math.random() * this.petalColors.length)];

    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -20,
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.18 + Math.random() * 0.22,
      rotation:      Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      wobble:        Math.random() * Math.PI * 2,
      wobbleSpeed:   0.012 + Math.random() * 0.012,
      wobbleAmp:     0.25 + Math.random() * 0.35,
      size:    5 + Math.random() * 7,
      opacity: 0.55 + Math.random() * 0.4,
      color,
    };
  }

  init() {
    this.petals = [];
    for (let i = 0; i < this.TARGET_COUNT; i++) {
      this.petals.push(this._createPetal(true));
    }
  }

  resize() {
    // Use logical (CSS) dimensions — canvas.width is scaled by DPR
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.petals.forEach(p => {
      if (p.x > w) p.x = Math.random() * w;
      if (p.y > h) p.y = Math.random() * h;
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Maintain target petal count
    while (this.petals.length < this.TARGET_COUNT) {
      this.petals.push(this._createPetal(false));
    }

    this.petals.forEach(p => {
      // Wobble
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Screen wrap — horizontal
      if (p.x < -30) p.x = w + 20;
      if (p.x > w + 30) p.x = -20;

      // Reset if off bottom
      if (p.y > h + 30) {
        Object.assign(p, this._createPetal(false));
      }
    });
  }

  /**
   * Draw a lotus-petal shape: elongated ellipse with a slight point.
   */
  _drawPetalShape(ctx, petal) {
    const { x, y, rotation, size, opacity, color } = petal;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity * 0.85;

    // Gradient from lighter center to transparent edge
    const grad = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size * 1.4);
    grad.addColorStop(0,   '#ffffff');
    grad.addColorStop(0.3,  color);
    grad.addColorStop(1,    color + '00');

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo( size * 0.6, -size * 0.4,  size * 0.55,  size * 0.6,  0, size * 0.8);
    ctx.bezierCurveTo(-size * 0.55,  size * 0.6, -size * 0.6, -size * 0.4,  0, -size);
    ctx.closePath();

    // NOTE: shadowBlur intentionally removed — it flushes the GPU compositing
    // pipeline on every petal draw (35×/frame). The radial gradient already
    // provides sufficient glow/softness.
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle vein line
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.85);
    ctx.lineTo(0,  size * 0.65);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  draw() {
    this.petals.forEach(p => this._drawPetalShape(this.ctx, p));
  }
}

window.ParticleSystem = ParticleSystem;
