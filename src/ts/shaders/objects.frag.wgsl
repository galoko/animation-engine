@group(0) @binding(2) var atlasSampler: sampler;
@group(0) @binding(3) var atlases: texture_2d_array<f32>;

@fragment
fn main(
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
    @location(2) @interpolate(flat) fragAtlasNum: u32,
) -> @location(0) vec4<f32> {
    var lightDir = normalize(vec3(0.656, 0.3, 0.14));
    var lightColor = vec3(1.);

    var diff = max(dot(fragNormal, lightDir), 0.0);
    var diffuse = diff * lightColor;

    var ambient = 0.5;

    var objectColor = textureSample(atlases, atlasSampler, fragUV, fragAtlasNum);

    var outputColor = vec4(min(ambient + diffuse, vec3(1)) * objectColor.rgb, objectColor.a);

    return outputColor;
}