#version 300 es

precision highp float;

in highp vec3 fragNormal;
in vec2 fragUV;

out vec4 outputColor;

uniform sampler2D sceneColors;
uniform sampler2D depthBuffer;

void main(void) {
	float depthOffset = 0.0;
	float depthMul = 1.0 / 67870.;
	float depthLogMul = 0.4;
	float minDepthValue = 0.85;

	vec4 fogBaseColorRGBA = vec4(0.125627145171165, 0.256408363580704, 0.279881805181503, 0.833333313465118);
	vec4 maxFogColorRGBA = vec4(0.315368860960007, 0.388478130102158, 0.441431760787964, 0.833333313465118);

    float depthMin = 15.0;
	float depthMax = 353840.0;

    vec3 sceneColor = texture(sceneColors, fragUV).rgb;

    float depthValue = texture(depthBuffer, fragUV).r;
	float stretchedDepthValue = (depthValue * 1.01 - 0.01) * 2.0 - 1.0;

	float someBullshit = depthMin * depthMax * 2.0;

    float depthDistanceFromZero = depthMax + depthMin;
    float depthLength = depthMax - depthMin;

    float depthValueInRangeFromOtherSide = depthDistanceFromZero - stretchedDepthValue * depthLength;

    float depthPower = someBullshit / depthValueInRangeFromOtherSide;

	float depthMulClamped = min(minDepthValue, exp2(depthLogMul * log2(clamp(depthPower * depthMul - depthOffset, 0.0, 1.0))));

	vec3 fogBaseColor = fogBaseColorRGBA.rgb;
	vec3 maxFogColor = maxFogColorRGBA.rgb;

    vec3 fogColorRange = maxFogColor - fogBaseColor;
    vec3 fogColor = fogBaseColor + vec3(depthMulClamped, depthMulClamped, depthMulClamped) * fogColorRange;

    vec3 sceneAfterFog = (sceneColor + vec3(depthMulClamped, depthMulClamped, depthMulClamped) * (fogColor - sceneColor)) * fogBaseColorRGBA.a;

    sceneColor = (depthValue < 1.0 - 10e-8) ? sceneAfterFog : sceneColor;

    outputColor = vec4(clamp(sceneColor, 0.0, 1.0), 1.0);
}