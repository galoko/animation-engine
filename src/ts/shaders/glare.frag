#version 300 es

precision highp float;

in highp vec4 vertColor;
in highp vec2 vertUV;

out vec4 outputColor;

uniform sampler2D glare;
uniform sampler2D checkerboard;

void main(void) {
	vec2 UV = gl_FragCoord.xy / 8.0;
	float checkerboardValue = texture(checkerboard, UV).r * 0.03125 - 0.0078125;

	vec4 colorValue = texture(glare, vertUV);
	vec3 finalColor = vertColor.rgb * colorValue.rgb;

	outputColor = vec4(finalColor + checkerboardValue, colorValue.a * vertColor.a);
}