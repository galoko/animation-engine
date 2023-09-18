@group(0) @binding(0) var linearSampler: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    var f = textureSample(tex, linearSampler, fragUV.xy).x;
    var c = 0.0 + fragUV.y * 0.01 + f * 0;
    return vec4(c, c, c, 1);
}