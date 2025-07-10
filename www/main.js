// main.js

// Exported function to initialize the viewer inside a container.
// The viewer instance is attached to container.canvas.viewer.
export function initViewer(container) {
    if (!container) return;
    // Avoid double-init
    if (container.canvas && container.canvas.viewer) return container.canvas.viewer;
    // Create the WebGL canvas if not present
    let canvas = container.querySelector('canvas.viewer-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'viewer-canvas';
        container.appendChild(canvas);
    }
    // ... viewer initialization code here ...
    // For example:
    // import { Viewer } from './viewer.js'; (if needed)
    // const viewer = new Viewer(canvas, ...);
    // Attach the instance for external access
    canvas.viewer = { 
        // expose whatever API or instance is needed
        // e.g. viewer, or direct methods
    };
    container.canvas = canvas;
    return canvas.viewer;
}

// Wait for #glviewer-container to exist in DOM, then initialize.
function waitForContainerAndInit() {
    function tryInit() {
        const container = document.getElementById('glviewer-container');
        if (container) {
            initViewer(container);
            return true;
        }
        return false;
    }
    if (!tryInit()) {
        // Fallback: poll every 100ms until found
        const interval = setInterval(() => {
            if (tryInit()) clearInterval(interval);
        }, 100);
    }
}

// Instead of ready(), use this logic:
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForContainerAndInit);
} else {
    waitForContainerAndInit();
}

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