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

struct PerObjectDataEntry {
    quat_scale: vec4<f32>,
    translation_atlasNum: vec4<f32>,
}

struct PerObjectData {
    entries: array<PerObjectDataEntry>,
}

@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read> perObjectData : PerObjectData;

fn quat_transform(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
    return v + 2 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

@vertex
fn main(@location(0) inputPosition: vec3<f32>, @location(3) paramsIndex: f32) -> @builtin(position) vec4<f32> {
    var index = u32(paramsIndex);

    var quat_scale = perObjectData.entries[index].quat_scale;
    var translation_atlasNum = perObjectData.entries[index].translation_atlasNum;

    var scale = quat_scale.w;

    var translation = translation_atlasNum.xyz;
    var atlasNum = translation_atlasNum.w;

    var quat_xyz = quat_scale.xyz;
    var s = length(quat_xyz);
    var quat = vec4(quat_xyz, sqrt(1.0 - s * s));

    var fragPosition = settings.viewProjection_shadow_near * vec4(quat_transform(quat, inputPosition) * scale + translation, 1.0);

    return fragPosition;
}