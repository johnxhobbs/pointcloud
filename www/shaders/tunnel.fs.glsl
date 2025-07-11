#version 300 es
// tunnel.fs.glsl
precision highp float;
in float v_reflect;
in float v_depth;
out vec4 fragColor;

// SPEED: All color math in GPU, avoid branch, use reflectivity and depth cue

void main() {
    // Compute color based on reflectivity (grayscale), depth cue blue
    float refl = v_reflect;
    float depthCue = smoothstep(0.0, 10.0, v_depth); // fade with distance
    vec3 col = mix(vec3(refl), vec3(0.5,0.6,1.0), depthCue * 0.4);

    // Circular point (discard outside radius)
    vec2 pc = gl_PointCoord * 2.0 - 1.0;
    if (dot(pc, pc) > 1.0) discard;

    fragColor = vec4(col, 1.0);
}