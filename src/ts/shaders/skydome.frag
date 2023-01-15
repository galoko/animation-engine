#version 300 es

precision highp float;

in highp vec4 vertColor;
out vec4 outputColor;

uniform sampler2D checkerboard;

void main(void) {
	vec2 UV = gl_FragCoord.xy / 8.0;
	float checkerboardValue = texture(checkerboard, UV).r * 0.03125 - 0.0078125;

    float colorOffset = 0.0107804285362363;
	vec3 offsettedColor = colorOffset + vertColor.rgb;
	outputColor = vec4(offsettedColor + checkerboardValue, vertColor.a);
}