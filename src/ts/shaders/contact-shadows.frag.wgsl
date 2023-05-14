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
}

@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var depthBufferScreenSpace: texture_depth_2d;
@group(0) @binding(2) var depthBuffersLightSource: texture_depth_2d_array;
@group(0) @binding(3) var linearSampler: sampler;
@group(0) @binding(4) var comparisonSampler: sampler_comparison;

@fragment
fn main(@builtin(position) screenPosInPixels: vec4<f32>,
    @location(0) fragNormal: vec3<f32>) -> @location(0) f32 {

    const randomVectors = array(
        vec2(0.493393, 0.394269),
        vec2(0.798547, 0.885922),
        vec2(0.247322, 0.926450),
        vec2(0.0514542013, 0.140782),
        vec2(0.831843, 0.00955228973),
        vec2(0.428632, 0.0171514004),
        vec2(0.015656, 0.749779),
        vec2(0.758385, 0.496170),
        vec2(0.223487, 0.562151),
        vec2(0.0116275996, 0.406995),
        vec2(0.241462, 0.304636),
        vec2(0.430311, 0.727226),
        vec2(0.981811, 0.278359),
        vec2(0.407056, 0.500534),
        vec2(0.123478, 0.463546),
        vec2(0.809534, 0.682272),    
    );

    const NEAR_BIAS = 0.0045;
    const FAR_BIAS = 0.005;

    const MAX_DEPTH_SQ = 10000 * 10000;

    const randomVectorLength = 1.0 / 1024.0;

    const nearDepthBufferLimitZ = 0.986808896064758;
    const farDepthBufferLimitZ = 0.998557209968567;
    const depthBufferLimitZ = 0.998557209968567;
    const nearFarBorderZ = 0.983973801136017;

    var uv = screenPosInPixels.xy * settings.invScreenResolution;

    var screenPosition: vec4<f32>;
    screenPosition.z = textureSample(depthBufferScreenSpace, linearSampler, uv);
    if (screenPosition.z >= depthBufferLimitZ) {
        discard;
    }

    screenPosition.x = uv.x * 2 - 1;
    screenPosition.y = (1 - uv.y) * 2 - 1;
    screenPosition.w = 1;

    var worldPosition = settings.viewProjection_inv * screenPosition;
    // do full matrix tranform
    worldPosition.x /= worldPosition.w;
    worldPosition.y /= worldPosition.w;
    worldPosition.z /= worldPosition.w;
    worldPosition.w = 1;

    var positionFromCamera = worldPosition.xyz - settings.cameraPosition;

    var distanceFromCameraSq = dot(positionFromCamera, positionFromCamera);
    var normalizedDistanceFromCamera = saturate(distanceFromCameraSq / MAX_DEPTH_SQ);

    normalizedDistanceFromCamera =
        1 - (normalizedDistanceFromCamera * normalizedDistanceFromCamera * normalizedDistanceFromCamera *
                normalizedDistanceFromCamera * normalizedDistanceFromCamera * normalizedDistanceFromCamera *
                normalizedDistanceFromCamera * normalizedDistanceFromCamera); // ^8

    var shouldUseFarDepthBuffer = screenPosition.z >= nearDepthBufferLimitZ;

    var levelToUse: u32; 
    var bias: f32;
    var depthBufferVP: mat4x4<f32>;
    if (shouldUseFarDepthBuffer) {
        depthBufferVP = settings.viewProjection_shadow_far;
        bias = FAR_BIAS;
        levelToUse = 1;
    } else {
        depthBufferVP = settings.viewProjection_shadow_near;
        bias = NEAR_BIAS;
        levelToUse = 0;
    }
    
    var depthBufferPos = depthBufferVP * worldPosition;
    var uvForDepthBuffer = depthBufferPos.xy * 0.5 + 0.5;
    uvForDepthBuffer.y = 1 - uvForDepthBuffer.y;
    var transformedDepthValue = depthBufferPos.z - bias;

    var someAccumulatedValue0 = 0.0;
    // sample 4x4 random places
    for (var counter = 0; counter < 8; counter++) {
        var vec0 = randomVectors[counter * 2] * 2 - 1;
        var vec1 = randomVectors[counter * 2 + 1] * 2 - 1;

        var uv0 = uvForDepthBuffer + vec0 * randomVectorLength;
        var uv1 = uvForDepthBuffer + vec1 * randomVectorLength;

        var depthCmpValue0 =
            textureSampleCompare(depthBuffersLightSource, comparisonSampler, uv0, levelToUse, transformedDepthValue);
        var depthCmpValue1 =
            textureSampleCompare(depthBuffersLightSource, comparisonSampler, uv1, levelToUse, transformedDepthValue);

        someAccumulatedValue0 += depthCmpValue0 + depthCmpValue1;
    }
    someAccumulatedValue0 /= 16.0;

    var farDepthBufferPos = settings.viewProjection_shadow_far * worldPosition;

    uvForDepthBuffer = farDepthBufferPos.xy * 0.5 + 0.5;
    uvForDepthBuffer.y = 1 - uvForDepthBuffer.y;
    transformedDepthValue = farDepthBufferPos.z - FAR_BIAS;

    var someAccumulatedValue1 = 0.0;
    for (var counter = 0; counter < 8; counter++) {
        var vec0 = randomVectors[counter * 2] * 2 - 1;
        var vec1 = randomVectors[counter * 2 + 1] * 2 - 1;

        var uv0 = uvForDepthBuffer + vec0 * randomVectorLength;
        var uv1 = uvForDepthBuffer + vec1 * randomVectorLength;

        var depthCmpValue0 =
            textureSampleCompare(depthBuffersLightSource, comparisonSampler, uv0, 1, transformedDepthValue);
        var depthCmpValue1 =
            textureSampleCompare(depthBuffersLightSource, comparisonSampler, uv1, 1, transformedDepthValue);

        someAccumulatedValue1 += depthCmpValue0 + depthCmpValue1;
    }
    
    if (levelToUse < 1 && screenPosition.z >= nearFarBorderZ) {
        someAccumulatedValue1 /= 16;

        // how much shadow is from border to farDepth limit
        var t = saturate((screenPosition.z - nearFarBorderZ) / (nearDepthBufferLimitZ - nearFarBorderZ));
        t = 3 * t * t - 2 * t * t * t;

        someAccumulatedValue0 += (someAccumulatedValue1 - someAccumulatedValue0) * t;
    }

    var output = 1 + normalizedDistanceFromCamera * (someAccumulatedValue0 - 1);
    if (output < 0) {
        discard;
    }
    
    return output;
}