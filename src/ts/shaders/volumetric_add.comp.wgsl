@group(0) @binding(0) var<uniform> z: u32;
@group(0) @binding(1) var input: texture_3d<f32>;
@group(0) @binding(2) var output: texture_storage_3d<rgba16float, write>;

@compute @workgroup_size(32, 32)
fn main(@builtin(global_invocation_id) threadNum : vec3<u32>) {
	var prevCoord = vec3(threadNum.xy, z - 1);
	var currentCoord = vec3(threadNum.xy, z);

	var prevValue = textureLoad(input, prevCoord, 0).x;
	textureStore(output, prevCoord, vec4(prevValue, 0, 0, 0));

    // TODO use uniform
    if (z < 90) {
        var currentValue = textureLoad(input, currentCoord, 0).x;
        textureStore(output, currentCoord, vec4(currentValue + prevValue, 0, 0, 0));
    }
}