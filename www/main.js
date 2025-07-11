// main.js – shared entry point for both Shiny and standalone test.html
// It waits until a container with id="glviewer-container" is present, then
// injects a WebGL canvas and wires up controls + file-input handling.
// The heavy lifting lives in viewer.js (pure WebGL2).

import { parseTiff } from './tiffParser.js';
import { Viewer } from './viewer.js';
import { setupControls } from './controls.js';

// Global references so Shiny message handlers can reach them
let viewer = null;          // Viewer instance (after first TIFF load)
let canvas = null;          // <canvas> element created inside the container

/**
 * Initialise the viewer UI inside the supplied container element.
 * This creates the <canvas>, sets up mouse/keyboard controls and returns it.
 * Exported so test.html (or other pages) can call it explicitly.
 */
export function initViewer(container) {
  if (!container) return null;
  if (canvas && container.contains(canvas)) {
    // Already initialised
    return canvas;
  }
  // Create canvas and attach to container
  canvas = document.createElement('canvas');
  canvas.className = 'viewer-canvas';
  canvas.tabIndex = 0;       // enable keyboard events
  container.appendChild(canvas);

  // Attach controls (orbit, zoom, move)
  setupControls(canvas);

  return canvas;
}

/**
 * Handle <input type="file"> changes anywhere in the document.
 * The first time a TIFF is loaded we create the Viewer; subsequent loads just replace the data.
 */
async function handleFileInput(evt) {
  if (!evt.target || evt.target.type !== 'file') return;
  const file = evt.target.files[0];
  if (!file) return;
  if (!canvas) return; // viewer not initialised yet

  try {
    const { depth, reflect, width, height } = await parseTiff(file);
    if (!viewer) {
      viewer = new Viewer(canvas, width, height);
      // Expose for controls.js or debugging
      canvas.viewer = viewer;
    }
    await viewer.setData(depth, reflect, width, height);
    viewer.render();
  } catch (err) {
    console.error('Failed to load TIFF:', err);
    alert('Could not load TIFF – see console for details');
  }
}

document.body.addEventListener('change', handleFileInput, true);

// Shiny → JS message handlers (only active inside Shiny app)
if (window.Shiny) {
  Shiny.addCustomMessageHandler('zPos', (val) => {
    if (viewer) viewer.setZ(val);
  });
  Shiny.addCustomMessageHandler('zoom', (val) => {
    if (viewer) viewer.setZoom(val);
  });
}

// Wait for #glviewer-container to exist; Shiny adds it lazily.
function waitForContainer() {
  const container = document.getElementById('glviewer-container');
  if (container) {
    initViewer(container);
    return;
  }
  // Poll every 100 ms until container appears.
  const id = setInterval(() => {
    const c = document.getElementById('glviewer-container');
    if (c) {
      clearInterval(id);
      initViewer(c);
    }
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForContainer);
} else {
  waitForContainer();
}