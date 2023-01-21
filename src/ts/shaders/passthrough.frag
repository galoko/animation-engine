#version 300 es

precision highp float;

in highp vec3 fragNormal;
in vec2 fragUV;

out vec4 outputColor;

uniform sampler2D tex;

void main(void) {
    outputColor = texture(tex, fragUV);
}