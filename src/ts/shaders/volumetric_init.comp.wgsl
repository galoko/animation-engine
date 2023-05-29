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

@group(0) @binding(1) var point_clamp_sampler: sampler;
@group(0) @binding(2) var linear_clamp_sampler: sampler;
@group(0) @binding(3) var linear_mirror_sampler: sampler;

@group(0) @binding(4) var depthBuffersLightSource: texture_depth_2d_array;
@group(0) @binding(5) var curve: texture_2d<f32>;
@group(0) @binding(6) var randomData: texture_3d<f32>;

@group(0) @binding(7) var swapChain0: texture_storage_3d<rgba16float, write>;
@group(0) @binding(8) var swapChain1: texture_storage_3d<rgba16float, write>;

fn unpack(v: vec4<f32>) -> f32 {
    return dot(v, vec4(1.0, 1/255.0, 1/65025.0, 1/160581375.0));
}

@compute @workgroup_size(32, 32)
fn main(@builtin(global_invocation_id) threadNum : vec3<u32>) {
    const randomVectors: array<vec3<f32>, 8> = array(
        vec3(0, 0, 0),
        vec3(0, 0, 1),
        vec3(0, 1, 0),
        vec3(0, 1, 1),
        vec3(1, 0, 0),
        vec3(1, 0, 1),
        vec3(1, 1, 0),
        vec3(1, 1, 1),
    );

    const normalizer: vec3<f32> = vec3(320, 192, 90);

    const randomVectorIndex = 3.0; // TODO randomize
    const randomMul = 0.1;

    const unknownMul0 = 0.85;
    const unknownMul1 = 0.85;
    const randomFinalMul = 0.3;

    const nearDepthBufferLimitZ = 0.986808896064758;
    const farDepthBufferLimitZ = 0.998557209968567;
    const depthBufferLimitZ = 0.998557209968567;

    var coordIn3DTexture = vec3<f32>(threadNum) / normalizer + randomVectors[u32(randomVectorIndex)] * 0.001;

    var screenPosition = vec4(
        coordIn3DTexture.x * 2 - 1,
        (1 - coordIn3DTexture.y) * 2 - 1,
        unpack(textureSampleLevel(curve, linear_clamp_sampler, vec2(coordIn3DTexture.z, 0), 0)), 
        1
    );

    var worldPosition = settings.viewProjection_inv * screenPosition;
    worldPosition /= worldPosition.w;
    
    var screenSpaceZ = screenPosition.z;
    if (screenSpaceZ < depthBufferLimitZ) {
        var shouldUseFarDepthBuffer = screenSpaceZ >= nearDepthBufferLimitZ;

        var levelToUse: u32; 
        var bias: f32;
        var depthBufferVP: mat4x4<f32>;
        if (shouldUseFarDepthBuffer) {
            depthBufferVP = settings.viewProjection_shadow_far;
            bias = 0;
            levelToUse = 1;
        } else {
            depthBufferVP = settings.viewProjection_shadow_near;
            bias = 0.01;
            levelToUse = 0;
        }

        var temp = (depthBufferVP * worldPosition).xyz;
        var depthBufferCoord = temp.xy * 0.5 + 0.5;
        depthBufferCoord.y = 1 - depthBufferCoord.y;

        var transformedDepthValue = temp.z - bias;

        var lightSourceDepthValue = textureSampleLevel(depthBuffersLightSource, point_clamp_sampler, depthBufferCoord, levelToUse, 0);
        if (lightSourceDepthValue < transformedDepthValue) {
            textureStore(swapChain0, threadNum, vec4(0.0, 0.0, 0.0, 0.0));
            textureStore(swapChain1, threadNum, vec4(0.0, 0.0, 0.0, 0.0));
            return;
        }
    }

    var relativeWorldPosition = worldPosition.xyz - settings.cameraPosition;

    var coordInRandomData = worldPosition.xyz * randomMul / 80;
    var randomValue = textureSampleLevel(randomData, linear_mirror_sampler, coordInRandomData, 0).x;

    var clampedTransformedZ = saturate(relativeWorldPosition.z / 150.0);
    var stretchedClampedTransformedZ = 3 - 2 * clampedTransformedZ;
    clampedTransformedZ = 1 - 0.75 * stretchedClampedTransformedZ * clampedTransformedZ * clampedTransformedZ;

    var randomComponent = randomFinalMul * (randomValue * clampedTransformedZ - 1) + 1;
    
    var directionToPosition = -normalize(relativeWorldPosition);
    var someCos = dot(directionToPosition, settings.sunDirection);

    var result =
        randomComponent *
        (unknownMul0 * ((-(unknownMul1 * unknownMul1) + 1) / 
        (12.56637 * (1 - unknownMul1 * someCos)) - 1) + 1);

    textureStore(swapChain0, threadNum, vec4(result, 0.0, 0.0, 0.0));
    textureStore(swapChain1, threadNum, vec4(result, 0.0, 0.0, 0.0));
}