struct Settings {
    viewProjection: mat4x4<f32>,
    viewProjection_inplace: mat4x4<f32>,
    viewProjection_sun: mat4x4<f32>,
    viewProjection_glare: mat4x4<f32>,
    viewProjection_shadow_near: mat4x4<f32>,
    viewProjection_shadow_far: mat4x4<f32>,
    viewProjection_shadow_near_uv: mat4x4<f32>,
    viewProjection_shadow_far_uv: mat4x4<f32>,
    viewProjection_inv: mat4x4<f32>,
    invScreenResolution: vec2<f32>,
    cameraPosition: vec3<f32>,
    sunDirection: vec3<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(2) var atlasSampler: sampler;
@group(0) @binding(3) var atlases: texture_2d_array<f32>;
@group(0) @binding(4) var contactShadowTexture: texture_2d<f32>;

@fragment
fn main(
    @builtin(position) screenPosInPixels: vec4<f32>,
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
    @location(2) @interpolate(flat) fragAtlasNum: u32,
) -> @location(0) vec4<f32> {
    var screenSpaceShadowValue = textureLoad(contactShadowTexture, vec2<i32>(floor(screenPosInPixels.xy)), 0).r;

    var lightDir = settings.sunDirection;
    var lightColor = vec3(1.);

    var amountOfSunLight = saturate(dot(-fragNormal, lightDir));
    var diffuse = screenSpaceShadowValue * amountOfSunLight * lightColor;

    var ambient = 0.3;

    var objectColor = textureSample(atlases, atlasSampler, fragUV, fragAtlasNum);

    var outputColor = vec4(min(ambient + diffuse, vec3(1)) * objectColor.rgb, objectColor.a);

    return outputColor;
}