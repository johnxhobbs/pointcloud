// viewer.js

export class TunnelViewer {
    constructor(canvas, opts = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) throw new Error('WebGL2 not supported');
        this.opts = opts;
        this.state = { };
        this.numPoints = 0;
        this.needsRender = false;
        this.program = null;
        this.buffers = {};
        this.textures = {};
        this.pointCloudLoaded = false;
        this.pointSize = 6.0; // Default point size
        this.frame = 0; // Frame counter
        this._setupGL();
        this._setupEvents();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    setPointSize(size) {
        this.pointSize = size;
        this.needsRender = true;
    });
    if (!this.gl) throw "WebGL2 not supported";
    this.canvas = canvas;
    this.width = width; this.height = height;
    // Camera params (orbit around tunnel axis, translation, zoom)
    this.state = {
      phi: 0, theta: 0, z: 0, zoom: 1
    };
    // Data
    this.depth = null;
    this.reflect = null;
    // Buffers
    this.pointVBO = null;
    this.numPoints = 0;
    // Shaders
    this.program = null;
    // Async setup
    this.initialised = false;
    this.ready = this.initGL().then(() => {
      this.initEvents();
      this.initialised = false; // Will be set true by setData when data is uploaded
      return true;
    });
  }

  async initGL() {
    const gl = this.gl;
    // Load shaders
    const vsSource = await loadShaderSrc("shaders/tunnel.vs.glsl");
    const fsSource = await loadShaderSrc("shaders/tunnel.fs.glsl");
    // Compile
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    // Link program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.program);
    }
    // Get attrib/uniform locations
    this.a_pointIdx = gl.getAttribLocation(this.program, "a_pointIdx");
    this.u_depthTex = gl.getUniformLocation(this.program, "u_depthTex");
    this.u_reflectTex = gl.getUniformLocation(this.program, "u_reflectTex");
    this.u_shape = gl.getUniformLocation(this.program, "u_shape");
    this.u_view = gl.getUniformLocation(this.program, "u_view");
    this.u_proj = gl.getUniformLocation(this.program, "u_proj");
    this.u_camera = gl.getUniformLocation(this.program, "u_camera");
    this.u_pointSize = gl.getUniformLocation(this.program, "u_pointSize");
    // Create empty textures
    this.depthTex = gl.createTexture();
    this.reflectTex = gl.createTexture();
    // SPEED: Single buffer for all points (row, col indices), pass as int to vertex shader.
    this.pointVBO = gl.createBuffer();

    // Set up GL state
    gl.clearColor(0.05,0.05,0.08,1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Only render on demand (see render)
    this.needsRender = true;
    return true;
  }

  compileShader(type, src) {
    const gl = this.gl;
    let shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader) + "\n" + src;
    }
    return shader;
  }

  // Upload TIFF layers to GPU textures, build VBO of (row,col) pairs
  async setData(depth, reflect, width, height) {
    await this.ready;
    const gl = this.gl;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.reflect = reflect;
    // -- Upload depth as 16-bit unsigned integer texture (R16UI) --
    gl.bindTexture(gl.TEXTURE_2D, this.depthTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // SPEED: keep as integer, no conversion, stays on GPU
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16UI, width, height, 0, gl.RED_INTEGER, gl.UNSIGNED_SHORT, depth);

    // -- Upload reflectivity as 16-bit unsigned integer texture (R16UI) --
    gl.bindTexture(gl.TEXTURE_2D, this.reflectTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16UI, width, height, 0, gl.RED_INTEGER, gl.UNSIGNED_SHORT, reflect);

    // -- Create point index buffer --
    // Each vertex is a (row, col) pair, packed as 2 ints
    // SPEED: No CPU transform, just upload indices, let GPU do math
    const numPoints = width * height;
    let pointIdx = new Uint32Array(numPoints * 2);
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let idx = i * width + j;
        pointIdx[2*idx] = i;
        pointIdx[2*idx+1] = j;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointVBO);
    gl.bufferData(gl.ARRAY_BUFFER, pointIdx, gl.STATIC_DRAW);
    this.numPoints = numPoints;
    this.needsRender = true;
    this.initialised = true;
    console.debug("[viewer] Point cloud uploaded", this.numPoints, "points.");
  }

  // Camera controls
  setZ(z) { this.state.z = z; this.needsRender = true; }
  setZoom(zoom) { this.state.zoom = zoom; this.needsRender = true; }
  orbit(dTheta, dPhi) {
    this.state.theta += dTheta;
    this.state.phi += dPhi;
    this.needsRender = true;
  }
  move(dz) { this.state.z += dz; this.needsRender = true; }

  // Called by controls.js when user interacts
  requestRender() { this.needsRender = true; }

  // Called on each frame (but only when needed)
  render() {
        if (!this.pointCloudLoaded || !this.program) return false;
        if (!this.needsRender) return false;

        this.frame = (this.frame || 0) + 1;

        const gl = this.gl;
        // ...other code...

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);

        // Set point size uniform
        const u_pointSize = gl.getUniformLocation(this.program, "u_pointSize");
        if (u_pointSize) gl.uniform1f(u_pointSize, this.pointSize);

        // ...setup uniforms, attribs...

        gl.drawArrays(gl.POINTS, 0, this.numPoints);

        console.debug(`[viewer] frame ${this.frame} drawn`, this.numPoints, 'points. cam', this.state);

        // ...other code...
        this.needsRender = false;
        return true;
    }

  // For controls.js: request frame only after interaction
  initEvents() {
    // Redraw on demand
    const renderLoop = () => {
      if (this.needsRender) {
        this.render();
      }
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
    // Resize canvas on window resize
    window.addEventListener('resize', () => {
      this.resize();
      this.requestRender();
    });
    this.resize();
  }

  resize() {
    // Set canvas size to display size (CSS pixels)
    const canvas = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    let w = canvas.clientWidth * dpr;
    let h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
}