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

struct VertexOutput {
    @builtin(position) fragPosition: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
    @location(1) fragUV: vec2<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;

@vertex
fn main(
    @location(0) inputPosition: vec3<f32>,
    @location(1) inputColor: vec4<f32>,
    @location(2) inputUV: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;

    var pos = settings.viewProjection_glare * vec4(inputPosition, 1.0);
    pos.z = pos.w;
    // max in depth
    output.fragPosition = pos;

    output.fragUV = inputUV;

    var rWeight = vec3(0.565203845500946, 0.228658571839333, 0.0142048010602593);
    var alpha = 0.833333313465118;

    var tintedColor = rWeight * inputColor.r;

    output.fragColor = vec4(tintedColor * alpha, inputColor.a);

    return output;
}