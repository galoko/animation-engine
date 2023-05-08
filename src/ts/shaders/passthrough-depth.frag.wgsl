@group(0) @binding(0) var linearSampler: sampler;
@group(0) @binding(1) var tex: texture_depth_2d;

@fragment
fn main(
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    var depth = textureSample(tex, linearSampler, fragUV);
    return vec4(depth, depth, depth, 1);
}