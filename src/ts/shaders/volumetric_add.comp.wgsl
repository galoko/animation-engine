@group(0) @binding(0) var<uniform> z: u32;
@group(0) @binding(1) var point_clamp_sampler: sampler;
@group(0) @binding(2) var input: texture_3d<f32>;
@group(0) @binding(3) var output: texture_storage_3d<rgba16float, write>;

@compute @workgroup_size(32, 32)
fn main(@builtin(global_invocation_id) threadNum : vec3<u32>) {
    const normalizer: vec3<f32> = vec3(320, 192, 90);

	var prevCoord = (vec3(0.5, 0.5, 0.5) + vec3<f32>(vec3(threadNum.xy, z - 1))) / normalizer;
	var prevValue = textureSampleLevel(input, point_clamp_sampler, prevCoord, 0).x;

	var prevDstCoord = vec3(threadNum.xy, z - 1);
	textureStore(output, prevDstCoord, vec4(prevValue, 0, 0, 0));

	var currentCoord = (vec3(0.5, 0.5, 0.5) + vec3<f32>(vec3(threadNum.xy, z))) / normalizer;
	var currentValue = textureSampleLevel(input, point_clamp_sampler, currentCoord, 0).x;

	var currentDstCoord = vec3(threadNum.xy, z);
    textureStore(output, currentDstCoord, vec4(currentValue + prevValue, 0, 0, 0));
}