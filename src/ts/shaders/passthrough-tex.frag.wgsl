@group(0) @binding(0) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    var color = textureLoad(tex, vec2<i32>(floor(fragUV * vec2(2, 2))), 0).rgb;

    return vec4(color, 0.5);
}