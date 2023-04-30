@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(0) fragColor: vec4<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) vec4<f32> {
    var color = textureSample(tex, linearSampler, fragUV);

	return fragColor * color;
}