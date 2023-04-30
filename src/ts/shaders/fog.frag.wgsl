@group(0) @binding(0) var linearSampler: sampler;
@group(0) @binding(1) var sceneColors: texture_2d<f32>;
@group(0) @binding(2) var depthBuffer: texture_depth_2d;

@fragment
fn main(
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) vec4<f32> {
	var depthOffset = 0.0;
	var depthMul = 1.0 / 67870.;
	var depthLogMul = 0.4;
	var minDepthValue = 0.85;

	var fogBaseColorRGBA = vec4(0.125627145171165, 0.256408363580704, 0.279881805181503, 0.833333313465118);
	var maxFogColorRGBA = vec4(0.315368860960007, 0.388478130102158, 0.441431760787964, 0.833333313465118);

    var depthMin = 15.0;
	var depthMax = 353840.0;

    var sceneColor = textureSample(sceneColors, linearSampler, fragUV).rgb;

    var depthValue = textureSample(depthBuffer, linearSampler, fragUV);
	var stretchedDepthValue = (depthValue * 1.01 - 0.01) * 2.0 - 1.0;

	var someBullshit = depthMin * depthMax * 2.0;

    var depthDistanceFromZero = depthMax + depthMin;
    var depthLength = depthMax - depthMin;

    var depthValueInRangeFromOtherSide = depthDistanceFromZero - stretchedDepthValue * depthLength;

    var depthPower = someBullshit / depthValueInRangeFromOtherSide;

	var depthMulClamped = min(minDepthValue, exp2(depthLogMul * log2(clamp(depthPower * depthMul - depthOffset, 0.0, 1.0))));

	var fogBaseColor = fogBaseColorRGBA.rgb;
	var maxFogColor = maxFogColorRGBA.rgb;

    var fogColorRange = maxFogColor - fogBaseColor;
    var fogColor = fogBaseColor + vec3(depthMulClamped, depthMulClamped, depthMulClamped) * fogColorRange;

    var sceneAfterFog = (sceneColor + vec3(depthMulClamped, depthMulClamped, depthMulClamped) * (fogColor - sceneColor)) * fogBaseColorRGBA.a;

    if (depthValue < 1.0 - 10e-8) {
        sceneColor = sceneAfterFog;
    } else {
        sceneColor = sceneColor;
    }

    return vec4(saturate(sceneColor), 1.0);
}