/*
   screenshot.js
   Exports the current canvas state as a PNG download.
   Filename format: ripple-garden-YYYY-MM-DD.png
*/

class ScreenshotManager {
  constructor(canvas) {
    this.canvas = canvas;
  }

  /**
   * Export canvas as PNG and trigger browser download.
   */
  capture() {
    try {
      // Build filename with today's date
      const now  = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const name = `ripple-garden-${date}.png`;

      // toDataURL encodes the current canvas frame
      const dataURL = this.canvas.toDataURL('image/png');

      const link      = document.createElement('a');
      link.href       = dataURL;
      link.download   = name;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return name;
    } catch (err) {
      console.error('[Ripple Garden] Screenshot failed:', err);
      return null;
    }
  }
}

window.ScreenshotManager = ScreenshotManager;
