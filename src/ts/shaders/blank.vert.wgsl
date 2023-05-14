struct Settings {
    viewProjection: mat4x4<f32>,
    viewProjection_inplace: mat4x4<f32>,
    viewProjection_sun: mat4x4<f32>,
    viewProjection_glare: mat4x4<f32>,
    viewProjection_shadow_near: mat4x4<f32>,
    viewProjection_shadow_far: mat4x4<f32>,
    viewProjection_shadow_near_uv: mat4x4<f32>,
    viewProjection_shadow_far_uv: mat4x4<f32>,
    invScreenResolution: vec2<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;

@vertex
fn main(@location(0) inputPosition: vec3<f32>) -> @builtin(position) vec4<f32> {
    // max in depth
    var pos = settings.viewProjection_sun * vec4(inputPosition * 0.04, 1.0);
    pos.z = pos.w * (1 - 10e-5);
    
    return pos;
}