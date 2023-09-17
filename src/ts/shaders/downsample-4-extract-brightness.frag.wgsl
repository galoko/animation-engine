struct Settings {
    invResolution: vec2<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var linearSampler: sampler; // linear, clamp
@group(0) @binding(2) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(1) inputUV: vec2<f32>
) -> @location(0) vec4<f32> {
    const neighbors: array<vec2<f32>, 4> = array(
		vec2(-1, -1),
		vec2( 1, -1),
		vec2( 1,  1),
		vec2(-1,  1),
    );

    var outputAlpha = 0.0;

	var acum = vec3(0.0);
	for (var i = 0; i < 4; i++) {
		var neighborUV = neighbors[i] * settings.invResolution + inputUV;

        var sampledColor = textureSample(tex, linearSampler, neighborUV).rgb;

		var brightness = dot(vec3(0.2125, 0.7154, 0.0721), sampledColor);

		acum += brightness * 0.25;
	}

    return vec4(acum, outputAlpha);
}