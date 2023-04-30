#version 300 es

precision highp float;

in highp vec3 fragNormal;
in vec2 fragUV;

out vec4 outputColor;

uniform sampler2D depthBuffer;

void main(void) {
	vec3 sunFogColor = vec3(0.739284157752991, 0.570270836353302, 0.490357995033264);
    float depthValue = texture(depthBuffer, fragUV).r;

    outputColor = vec4(sunFogColor * depthValue, 1.0);
}