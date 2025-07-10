// main.js (entry point for tunnel viewer)
// Handles Shiny bindings, file input, creates canvas, wires up modules.

import { parseTiff } from './tiffParser.js';
import { Viewer } from './viewer.js';
import { setupControls } from './controls.js';

// Helper: Wait for DOM
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

let viewer = null;

ready(() => {
  // Insert canvas into DOM
  const container = document.getElementById("glviewer-container");
  let canvas = document.createElement("canvas");
  canvas.id = "glcanvas";
  canvas.tabIndex = 0; // For key events
  container.appendChild(canvas);

  // Set up viewer controls UI (sliders etc)
  setupControls(canvas);

  // Hook up file input (Shiny input binding = fileInput_tiffFile)
  // Wait for file to be selected
  document.body.addEventListener('change', async (e) => {
    if (e.target && e.target.type === "file") {
      let file = e.target.files[0];
      if (!file) return;
      // Parse TIFF in browser, extract two 16-bit layers (depth, reflectivity)
      const {depth, reflect, width, height} = await parseTiff(file);
      // Create or update viewer
      if (!viewer) {
        viewer = new Viewer(canvas, width, height);
      }
      viewer.setData(depth, reflect, width, height);
      viewer.render(); // Initial draw
    }
  });

  // Listen to Shiny messages for zPos and zoom (from R server)
  if (window.Shiny) {
    Shiny.addCustomMessageHandler("zPos", (val) => {
      if (viewer) viewer.setZ(val);
    });
    Shiny.addCustomMessageHandler("zoom", (val) => {
      if (viewer) viewer.setZoom(val);
    });
  }
});