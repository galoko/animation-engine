@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var checkerboard: texture_2d<f32>;

@fragment
fn main(
    @builtin(position) gl_FragCoord: vec4<f32>,
    @location(0) fragColor: vec4<f32>
) -> @location(0) vec4<f32> {
	var UV = gl_FragCoord.xy / 8.0;
	var checkerboardValue = textureSample(checkerboard, linearSampler, UV).r * 0.03125 - 0.0078125;

    var colorOffset = 0.0107804285362363;
	var offsettedColor = colorOffset + fragColor.rgb;
	var outputColor = vec4(offsettedColor + checkerboardValue, fragColor.a);

    return outputColor;
}