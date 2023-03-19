#version 300 es

precision highp float;

layout(location = 0) in vec3 inputPosition;
layout(location = 1) in vec4 inputColor;
layout(location = 2) in vec2 inputUV;

layout(std140) uniform settings {
    mat4 vp;
};

void main(void) {
    vec4 pos = vp * vec4(inputPosition, 1.0);
    pos.z = pos.w * (1.0 - 10e-7);
    // max in depth
    gl_Position = pos;
}