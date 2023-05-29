@group(0) @binding(0) var volumetricLightScreenBuffer: texture_2d<f32>;

@fragment
fn main(
    @builtin(position) screenPos: vec4<f32>,
    @location(0) fragNormal: vec3<f32>,
) -> @location(0) vec4<f32> {
    const volumetricLightColor = vec3(0.738756477832794, 0.557605266571045, 0.47399827837944);

    var light = textureLoad(volumetricLightScreenBuffer, vec2<i32>(floor(screenPos.xy)), 0).x;

    return vec4(volumetricLightColor * light, 0);
}