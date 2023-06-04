var<workgroup> volumetricValues: array<f32, 570>;
var<workgroup> depthValues: array<f32, 570>;

@group(0) @binding(0) var<uniform> resolution: vec2<i32>;

@group(0) @binding(1) var volumetricScreenSpace: texture_2d<f32>;
@group(0) @binding(2) var depthBuffer: texture_depth_2d;

@group(0) @binding(3) var output: texture_storage_2d<r32float, write>;

@compute @workgroup_size(1, 570)
fn main(@builtin(local_invocation_id) threadNum : vec3<u32>, @builtin(workgroup_id) dispatchNums: vec3<u32>) {
	var currentOffsetY = i32(threadNum.y) - 15;
	var pixelY = i32(dispatchNums.y) * 540 + currentOffsetY;
	var pixelX = i32(dispatchNums.x);

	var pixelCoord = clamp(vec2(pixelX, pixelY), vec2(0, 0), resolution);

	var volumetricValue = textureLoad(volumetricScreenSpace, pixelCoord, 0).x;
	var depth = textureLoad(depthBuffer, pixelCoord, 0);

	// cache the values
	volumetricValues[threadNum.y] = volumetricValue;
	depthValues[threadNum.y] = depth;

    workgroupBarrier();

	if (currentOffsetY >= 0 && currentOffsetY < 540) {
		var neighbors = vec4<i32>(threadNum.yyyy) + vec4(-12, -6, 6, 12);

		var depthDifferenceAcrossNeighbors = depth * 4 -
			depthValues[neighbors.x] -
			depthValues[neighbors.y] -
			depthValues[neighbors.z] -
			depthValues[neighbors.w];

		if (abs(depthDifferenceAcrossNeighbors) < 0.002) {
			volumetricValue = volumetricValue * 0.222338006 +
				volumetricValues[neighbors.x] * 0.178399995 +
				volumetricValues[neighbors.y] * 0.210430995 +
				volumetricValues[neighbors.z] * 0.210430995 +
				volumetricValues[neighbors.w] * 0.178399995;
		}

        textureStore(output, pixelCoord, vec4(volumetricValue, volumetricValue, volumetricValue, volumetricValue));
	}
}