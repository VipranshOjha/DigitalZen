/* ============================================================
   theme-manager.js
   Manages visual themes — Night Pond & Dawn Pond.
   Updates CSS variables on the document root and fires a
   custom 'themechange' event so other systems can adapt.
   ============================================================ */

class ThemeManager {
  constructor() {
    this.themes = {
      night: {
        name: 'Night Pond',
        bgDeep:    '#020818',
        bgMid:     '#04122e',
        bgSurface: '#081a40',
        // Gradient stops for canvas background
        gradient: [
          { stop: 0.0, color: '#020818' },
          { stop: 0.4, color: '#04122e' },
          { stop: 0.75, color: '#081a40' },
          { stop: 1.0,  color: '#030f25' },
        ],
        // Subtle shimmer lines tint
        shimmerColor: 'rgba(124,58,237,0.06)',
        // Vignette color
        vignetteColor: 'rgba(0,0,8,0.55)',
        // Particle petal colors
        petalColors: ['#f9a8d4', '#f472b6', '#e879f9', '#c084fc', '#fda4af'],
        // Lotus flower tints
        flowerColors: ['#f472b6', '#e879f9', '#f9a8d4', '#c084fc'],
        // UI data-theme attr
        attr: 'night',
      },
      dawn: {
        name: 'Dawn Pond',
        bgDeep:    '#071520',
        bgMid:     '#0d2b3e',
        bgSurface: '#123650',
        gradient: [
          { stop: 0.0, color: '#071520' },
          { stop: 0.35, color: '#0d2b3e' },
          { stop: 0.7,  color: '#0f3f52' },
          { stop: 1.0,  color: '#071520' },
        ],
        shimmerColor: 'rgba(14,165,233,0.06)',
        vignetteColor: 'rgba(0,4,12,0.50)',
        petalColors: ['#fde68a', '#fcd34d', '#fdba74', '#f9a8d4', '#86efac'],
        flowerColors: ['#fcd34d', '#fdba74', '#f9a8d4', '#6ee7b7'],
        attr: 'dawn',
      },
    };

    this.current = 'night';
  }

  get theme() {
    return this.themes[this.current];
  }

  /**
   * Switch to a named theme, update DOM attributes, and dispatch event.
   * @param {string} name  'night' | 'dawn'
   */
  setTheme(name) {
    if (!this.themes[name] || name === this.current) return;
    this.current = name;
    document.documentElement.setAttribute('data-theme', this.themes[name].attr);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: this.themes[name] } }));
  }

  toggle() {
    this.setTheme(this.current === 'night' ? 'dawn' : 'night');
  }
}

// Singleton export (globals-based module pattern for no-build env)
window.ThemeManager = ThemeManager;
