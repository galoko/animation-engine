struct Settings {
    viewProjection: mat4x4<f32>,
    viewProjection_inplace: mat4x4<f32>,
    viewProjection_sun: mat4x4<f32>,
}

struct VertexOutput {
    @builtin(position) fragPosition: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;

@vertex
fn main(
    @location(0) inputPosition: vec3<f32>,
    @location(1) inputColor: vec4<f32>,
) -> VertexOutput {
    var output: VertexOutput;

    var pos = settings.viewProjection_inplace * vec4(inputPosition, 1.0);
    pos.z = pos.w;
    // max in depth
    output.fragPosition = pos;

    var rWeight = vec3(0.391360133886337, 0.386311918497086, 0.389162868261337);
    var gWeight = vec3(0.398082792758942, 0.398599475622177, 0.403697550296783);
    var bWeight = vec3(0.140491753816605, 0.252542823553085, 0.296034902334213);
    var alpha = 0.833333313465118;

    var tintedColor = rWeight * inputColor.r + gWeight * inputColor.g + bWeight * inputColor.b;

    output.fragColor = vec4(tintedColor * alpha, inputColor.a);

    return output;
}