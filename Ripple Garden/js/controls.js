/* ============================================================
   controls.js  (v3 — with layered audio panel)
   Changes from v2:
   · Audio button now opens an audio panel (not a bare toggle)
   · Audio panel contains: master toggle pill + volume slider
   · Volume slider drives AudioManager.setMasterVolume()
   · A key still toggles the full audio system on/off
   · Panel panel-close logic extended to 'audio' panel name
   · All previous optimisations preserved
   ============================================================ */

class Controls {
  constructor({ themeManager, rippleSystem, audioManager, screenshotManager, toastFn }) {
    this.theme      = themeManager;
    this.ripples    = rippleSystem;
    this.audio      = audioManager;
    this.screenshot = screenshotManager;
    this.toast      = toastFn;

    this._activePanel = null; // 'theme' | 'palette' | 'audio' | null
    this._audioOn     = false;

    // Cache all DOM references once — never query inside event handlers
    this._els = {
      btnTheme:       document.getElementById('btn-theme'),
      btnPalette:     document.getElementById('btn-palette'),
      btnAudio:       document.getElementById('btn-audio'),
      btnClear:       document.getElementById('btn-clear'),
      btnScreenshot:  document.getElementById('btn-screenshot'),
      themePanel:     document.getElementById('theme-panel'),
      palettePanel:   document.getElementById('palette-panel'),
      audioPanel:     document.getElementById('audio-panel'),
      audioToggleBtn: document.getElementById('audio-toggle-btn'),
      volumeSlider:   document.getElementById('volume-slider'),
      volumeDisplay:  document.getElementById('volume-display'),
      audioIconOn:    document.getElementById('audio-icon-on'),
      audioIconOff:   document.getElementById('audio-icon-off'),
      themeBtns:      Array.from(document.querySelectorAll('.theme-btn')),
      paletteBtns:    Array.from(document.querySelectorAll('.palette-btn')),
    };

    this._bindButtons();
    this._bindKeyboard();
    this._bindPanelClose();
    this._bindVolumeSlider();
  }

  /* ── Button Bindings ─────────────────────────────────────── */
  _bindButtons() {
    const { btnTheme, btnPalette, btnAudio, btnClear, btnScreenshot } = this._els;

    btnTheme?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel('theme', btnTheme);
    });

    btnPalette?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel('palette', btnPalette);
    });

    // Audio button opens the audio panel
    btnAudio?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel('audio', btnAudio);
    });

    btnClear?.addEventListener('click', () => {
      this.ripples.clear();
      this.toast('✨ Canvas cleared');
    });

    btnScreenshot?.addEventListener('click', () => {
      const name = this.screenshot.capture();
      if (name) this.toast(`📸 Saved: ${name}`);
      else      this.toast('❌ Screenshot failed');
    });

    // ── Audio panel: inner toggle pill ───────────────────────
    this._els.audioToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleAudio();
    });

    // ── Theme panel option buttons ────────────────────────────
    this._els.themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.theme;
        this.theme.setTheme(t);
        this._syncThemeBtns();
        this.toast(`🌊 ${this.theme.theme.name}`);
        this._closePanel();
      });
    });

    // ── Palette panel option buttons ──────────────────────────
    this._els.paletteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.palette;
        this.ripples.setPalette(p);
        this._syncPaletteBtns(p);
        const labels = { aurora: '🌌 Aurora', sunset: '🌅 Sunset', sakura: '🌸 Sakura', emerald: '🍃 Emerald' };
        this.toast(`${labels[p] || p} palette`);
        this._closePanel();
      });
    });
  }

  /* ── Volume Slider ───────────────────────────────────────── */
  _bindVolumeSlider() {
    const slider  = this._els.volumeSlider;
    const display = this._els.volumeDisplay;
    if (!slider) return;

    const updateSlider = (val) => {
      const pct = Math.round(val);
      slider.value = pct;
      if (display) display.textContent = `${pct}%`;

      // Update the filled track portion via background-size
      slider.style.backgroundSize = `${pct}% 100%`;

      // Notify AudioManager
      this.audio.setMasterVolume(pct / 100);
    };

    // Live update while dragging
    slider.addEventListener('input', () => {
      updateSlider(Number(slider.value));
    });

    // Prevent slider interaction from closing the panel
    slider.addEventListener('click', e => e.stopPropagation());

    // Initialise display to match AudioManager default (25%)
    updateSlider(Math.round(this.audio.getMasterVolume() * 100));
  }

  /* ── Audio toggle (master on/off) ───────────────────────── */
  _toggleAudio() {
    const on = this.audio.toggle();
    this._audioOn = on;

    // Update top-bar speaker icon
    const { audioIconOn, audioIconOff, btnAudio, audioToggleBtn } = this._els;
    if (audioIconOn)  audioIconOn.style.display  = on ? 'block' : 'none';
    if (audioIconOff) audioIconOff.style.display = on ? 'none'  : 'block';

    // Update top-bar button glow
    btnAudio?.classList.toggle('active-state', on);

    // Update the pill inside the audio panel
    if (audioToggleBtn) {
      audioToggleBtn.textContent = on ? 'On' : 'Off';
      audioToggleBtn.classList.toggle('is-on', on);
    }

    this.toast(on ? '🎵 Soundscape on' : '🔇 Soundscape off');
  }

  /* ── Panel Management ───────────────────────────────────── */

  /**
   * Maps a panel name to its DOM element.
   */
  _panelEl(name) {
    if (name === 'theme')   return this._els.themePanel;
    if (name === 'palette') return this._els.palettePanel;
    if (name === 'audio')   return this._els.audioPanel;
    return null;
  }

  /**
   * Open or close a named panel, positioned below its trigger button.
   * getBoundingClientRect() makes it responsive + resize-safe.
   */
  _togglePanel(name, triggerBtn) {
    if (this._activePanel === name) {
      this._closePanel();
      return;
    }
    this._closePanel();
    this._activePanel = name;

    const panel = this._panelEl(name);
    if (!panel || !triggerBtn) return;

    // ── Dynamic positioning ───────────────────────────────────
    const btnRect = triggerBtn.getBoundingClientRect();
    const vw      = window.innerWidth;

    panel.style.left = '-9999px';
    panel.style.top  = '0px';
    panel.classList.remove('hidden');

    const panelW = panel.offsetWidth;

    let left = btnRect.left;
    if (left + panelW > vw - 8) left = vw - panelW - 8;
    left = Math.max(8, left);

    panel.style.left = `${left}px`;
    panel.style.top  = `${btnRect.bottom + 6}px`;
    // ─────────────────────────────────────────────────────────

    triggerBtn.classList.add('active-state');

    // Keep audio button glow if audio is already on
    if (name !== 'audio' && this._audioOn) {
      this._els.btnAudio?.classList.add('active-state');
    }
  }

  _closePanel() {
    if (this._activePanel) {
      const panel = this._panelEl(this._activePanel);
      panel?.classList.add('hidden');
    }

    // Remove active-state from all panel-trigger buttons
    const { btnTheme, btnPalette, btnAudio } = this._els;
    btnTheme?.classList.remove('active-state');
    btnPalette?.classList.remove('active-state');
    // Re-apply audio glow if sound is on (it's a persistent state, not just panel)
    if (this._audioOn) {
      btnAudio?.classList.add('active-state');
    } else {
      btnAudio?.classList.remove('active-state');
    }

    this._activePanel = null;
  }

  _bindPanelClose() {
    document.addEventListener('click', () => this._closePanel());

    // Prevent panel-internal clicks from reaching document
    ['themePanel', 'palettePanel', 'audioPanel'].forEach(key => {
      this._els[key]?.addEventListener('click', e => e.stopPropagation());
    });
  }

  /* ── Keyboard Shortcuts ──────────────────────────────────── */
  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.code) {

        // Space — clear canvas
        case 'Space':
          e.preventDefault();
          this.ripples.clear();
          this.toast('✨ Canvas cleared');
          break;

        // T — cycle theme
        case 'KeyT':
          this.theme.toggle();
          this._syncThemeBtns();
          this.toast(`🌊 ${this.theme.theme.name}`);
          break;

        // P — cycle palette immediately (mirrors T)
        case 'KeyP': {
          const next = this.ripples.cyclePalette();
          this._syncPaletteBtns(next);
          const labels = { aurora: '🌌 Aurora', sunset: '🌅 Sunset', sakura: '🌸 Sakura', emerald: '🍃 Emerald' };
          this.toast(`${labels[next] || next} palette`);
          break;
        }

        // A — toggle the entire soundscape on/off
        case 'KeyA':
          this._toggleAudio();
          break;

        // S — screenshot
        case 'KeyS': {
          const name = this.screenshot.capture();
          if (name) this.toast(`📸 Saved: ${name}`);
          break;
        }

        // Esc — close any open panel
        case 'Escape':
          this._closePanel();
          break;
      }
    });
  }

  /* ── Sync helpers ────────────────────────────────────────── */
  _syncThemeBtns() {
    this._els.themeBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.theme === this.theme.current);
    });
  }

  _syncPaletteBtns(activePalette) {
    this._els.paletteBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.palette === activePalette);
    });
  }
}

window.Controls = Controls;
