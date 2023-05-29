@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var pointRepeatSampler: sampler;
@group(0) @binding(3) var glare: texture_2d<f32>;
@group(0) @binding(4) var dithering: texture_2d<f32>;

@fragment
fn main(
    @builtin(position) screenPosInPixels: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) vec4<f32> {
	var UV = screenPosInPixels.xy / 8.0;
	var ditheringValue = textureSample(dithering, pointRepeatSampler, UV).r * 0.03125 - 0.0078125;

	var colorValue = textureSample(glare, linearSampler, fragUV);
	var finalColor = fragColor.rgb * colorValue.rgb;

	return vec4(finalColor + ditheringValue, colorValue.a * fragColor.a);
}