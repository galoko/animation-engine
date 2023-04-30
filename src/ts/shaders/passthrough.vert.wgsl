struct VertexOutput {
    @builtin(position) fragPosition: vec4<f32>,
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
}

@vertex
fn main(
    @location(0) inputPosition: vec3<f32>,
    @location(1) inputNormal: vec3<f32>,
    @location(2) inputUV: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;

    output.fragPosition = vec4(inputPosition, 1.0);
    output.fragNormal = inputNormal;
    output.fragUV = inputUV;

    return output;
}