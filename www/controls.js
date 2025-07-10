// controls.js
// Handles camera controls: mouse drag orbit, wheel zoom, forward/backward slider.
// SPEED: No unnecessary events, only sends requests to viewer when needed.

let isDragging = false, lastX = 0, lastY = 0;

export function setupControls(canvas) {
  let viewer = null;
  // Find Viewer instance injected by main.js
  setTimeout(() => {
    viewer = window.viewer || null;
  }, 1000);

  // Mouse drag to orbit
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    // Sensitivity tuned for typical tunnel scale
    if (canvas.viewer) {
      canvas.viewer.orbit(dx * 0.01, dy * 0.01);
      canvas.viewer.requestRender();
    }
  });
  window.addEventListener('mouseup', (e) => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  // Mouse wheel for zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (canvas.viewer) {
      let z = Math.max(0.5, Math.min(3, canvas.viewer.state.zoom + (e.deltaY < 0 ? 0.05 : -0.05)));
      canvas.viewer.setZoom(z);
      canvas.viewer.requestRender();
    }
  }, {passive:false});

  // Keyboard: arrow keys to move forward/back
  canvas.addEventListener('keydown', (e) => {
    if (canvas.viewer && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      let dz = (e.key === "ArrowUp" ? 10 : -10);
      canvas.viewer.move(dz);
      canvas.viewer.requestRender();
    }
  });
}