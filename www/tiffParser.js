// tiffParser.js
// Tiny wrapper around UTIF.js to extract two 16-bit layers (depth, reflectivity) from uploaded TIFF file.

// SPEED: All parsing is done in browser; data stays in GPU memory after upload.

export async function parseTiff(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        let buffer = e.target.result;
        let ifds = UTIF.decode(buffer);
        UTIF.decodeImages(buffer, ifds);
        // Assume first two IFDs are depth and reflectivity layers (both 16-bit).
        // If only one IFD, assume both channels in one image, otherwise must be two images.
        let depthImage = ifds[0];
        let reflectImage = ifds.length > 1 ? ifds[1] : ifds[0];
        let width = depthImage.width, height = depthImage.height;
        // UTIF returns Uint16Array for 16-bit.
        let depth = UTIF.toRGBA8(depthImage); // Returns Uint8ClampedArray, but we want 16-bit.
        // Instead, decode raw data:
        let rawDepth = new Uint16Array(depthImage.data.buffer, depthImage.data.byteOffset, width * height);
        let rawReflect = new Uint16Array(reflectImage.data.buffer, reflectImage.data.byteOffset, width * height);
        resolve({
          depth: rawDepth,
          reflect: rawReflect,
          width, height
        });
      } catch (err) {
        reject("TIFF parse failed: " + err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}