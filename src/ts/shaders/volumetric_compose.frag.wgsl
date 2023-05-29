@group(0) @binding(0) var point_clamp_sampler: sampler;
@group(0) @binding(1) var linear_clamp_sampler: sampler;

@group(0) @binding(2) var dithering: texture_2d<f32>;
@group(0) @binding(3) var depthBuffer: texture_depth_2d;
@group(0) @binding(4) var volumetricLightBuffer: texture_3d<f32>;
@group(0) @binding(5) var curve: texture_2d<f32>;

fn unpack(v: vec4<f32>) -> f32 {
    return dot(v, vec4(1.0, 1/255.0, 1/65025.0, 1/160581375.0));
}

@fragment
fn main(
    @builtin(position) screenPos: vec4<f32>,
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) f32 {
    const lightMul = 0.0401901230216026;
    const reverseDepthMul = 0.75;

    var screenDepth = textureLoad(depthBuffer, vec2<i32>(floor(screenPos.xy)), 0);
    var curvedDepth = clamp(unpack(textureSampleLevel(curve, linear_clamp_sampler, vec2(screenDepth, 0), 0)), 0, 0.9999);
    
    var volumetricBufferCoord = vec3(fragUV, curvedDepth);
    var lightValue = textureSampleLevel(volumetricLightBuffer, linear_clamp_sampler, volumetricBufferCoord, 0).x * lightMul;

    var ditherValue = textureSample(dithering, point_clamp_sampler, 0.125 * screenPos.xy).x;
    var ditheredLightValue = (ditherValue * 0.03125 + lightValue) - 0.0078125;

    if (false && reverseDepthMul >= 0.001) {
        // TODO
        return 0;
    } else {
        return ditheredLightValue;
    }
}