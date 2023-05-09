struct Settings {
    viewProjection: mat4x4<f32>,
    viewProjection_inplace: mat4x4<f32>,
    viewProjection_sun: mat4x4<f32>,
    viewProjection_glare: mat4x4<f32>,
    viewProjection_shadow_near: mat4x4<f32>,
    viewProjection_shadow_far: mat4x4<f32>,
}

struct VertexOutput {
    @builtin(position) fragPosition: vec4<f32>,
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;

@vertex
fn main(
    @location(0) inputPosition: vec3<f32>,
    @location(1) inputNormal: vec3<f32>,
    @location(2) inputUV: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.fragPosition = settings.viewProjection * vec4(inputPosition, 1);
    output.fragNormal = inputNormal;
    output.fragUV = inputUV;

    return output;
}