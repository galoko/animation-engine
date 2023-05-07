struct Settings {
    viewProjection: mat4x4<f32>,
    viewProjection_inplace: mat4x4<f32>,
    viewProjection_sun: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;

@vertex
fn main(@location(0) inputPosition: vec3<f32>) -> @builtin(position) vec4<f32> {
    // max in depth
    var pos = settings.viewProjection_sun * vec4(inputPosition * 0.04, 1.0);
    pos.z = pos.w * (1.0 - 10e-7);
    
    return pos;
}