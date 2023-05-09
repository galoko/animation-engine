@group(0) @binding(0) var linearSampler: sampler;
@group(0) @binding(1) var depthBufferScreenSpace: texture_2d<f32>;
@group(0) @binding(2) var depthBuffersLightSource: texture_depth_2d_array;

@fragment
fn main(
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) vec4<f32> {

    return vec4(1, 1, 1, 1);
}