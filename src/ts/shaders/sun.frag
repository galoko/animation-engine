#version 300 es

precision highp float;

in highp vec4 vertColor;
in highp vec2 vertUV;
out vec4 outputColor;

uniform sampler2D tex;

void main(void) {
    vec4 color = texture(tex, vertUV);

	outputColor = vertColor * color;

    // outputColor = vec4(1.0, 0, 1.0, 1.0);
}