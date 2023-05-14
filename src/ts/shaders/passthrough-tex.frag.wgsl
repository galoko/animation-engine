@group(0) @binding(0) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    var depth = pow(textureLoad(tex, vec2<i32>(floor(fragUV * vec2(3840.0, 2118.0))), 0).r, 1);
    
    if (depth < 1) {
        depth = 0;
    } else {
        depth = 1;
    }

    return vec4(depth, depth, depth, 1);
}