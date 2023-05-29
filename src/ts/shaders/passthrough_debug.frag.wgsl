@group(0) @binding(0) var linearSampler: sampler;
@group(0) @binding(1) var tex: texture_3d<f32>;

fn unpack(v: vec4<f32>) -> f32 {
    return dot(v, vec4(1.0, 1/255.0, 1/65025.0, 1/160581375.0));
}

@fragment
fn main(
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    var coord = vec3(fragUV.xy, 76.5 / 90);
    var f = textureSample(tex, linearSampler, coord).x;
    return vec4(f, f, f, 1);
}