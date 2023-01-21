#version 300 es

layout(location = 0) in vec3 inputPosition;
layout(location = 1) in vec3 inputNormal;
layout(location = 2) in vec2 inputUV;

out highp vec3 fragNormal;
out highp vec2 fragUV;

void main(void) {
    gl_Position = vec4(inputPosition, 1.0);
    fragNormal = inputNormal;
    fragUV = inputUV;
}