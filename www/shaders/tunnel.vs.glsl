#version 300 es
// tunnel.vs.glsl
// Vertex shader: transcodes cylindrical TIFF (row, col, radius) to 3D point cloud in tunnel
precision highp float;
//precision highp int;
precision highp usampler2D;

in uvec2 a_pointIdx; // (row, col)

uniform usampler2D u_depthTex;       // 16-bit depth (radius in mm)
uniform usampler2D u_reflectTex;     // 16-bit reflectivity
uniform vec2 u_shape;                // width, height (columns, rows)
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec4 u_camera;               // (theta, phi, z, zoom)
uniform float u_pointSize;

out float v_reflect;
out float v_depth;

// SPEED: All math here, one draw call, no CPU loop

void main() {
    // Get indices
    uint row = a_pointIdx.x;
    uint col = a_pointIdx.y;
    // Map (row, col) to cylindrical coordinates:
    // Each row is 1cm increment along axis, col is angle, depth is radius in mm
    float z = float(row) * 0.01; // 1cm steps, in meters
    float theta = float(col) / u_shape.x * 6.28318530718; // 2*pi

    // Fetch radius (in mm), reflectivity from textures
    uint r_mm = texelFetch(u_depthTex, ivec2(col, row), 0).r;
    uint refl = texelFetch(u_reflectTex, ivec2(col, row), 0).r;
    float r = float(r_mm) * 0.001; // convert to meters

    // Project to Cartesian
    float x = r * cos(theta);
    float y = r * sin(theta);

    // Compose position
    vec4 pos = vec4(x, y, z, 1.0);
    // Transform
    gl_Position = u_proj * u_view * pos;

    // Point size attenuates with distance (smaller as further from viewer)
    // SPEED: Avoid branch, use smoothstep
    float dist = length((u_view * pos).xyz);
    gl_PointSize = u_pointSize / (1.0 + dist * 0.5);

    // Pass to fragment
    v_reflect = float(refl) / 65535.0;
    v_depth = r;
}