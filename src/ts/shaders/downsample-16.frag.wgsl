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
    const neighbors: array<vec2<f32>, 16> = array(
		vec2(-1.5, -1.5),
		vec2(-0.5, -1.5),
		vec2( 0.5, -1.5),
		vec2( 1.5, -1.5),

		vec2(-1.5, -0.5),
		vec2(-0.5, -0.5),
		vec2( 0.5, -0.5),
		vec2( 1.5, -0.5),
        
		vec2(-1.5,  0.5),
		vec2(-0.5,  0.5),
		vec2( 0.5,  0.5),
		vec2( 1.5,  0.5),

		vec2(-1.5,  1.5),
		vec2(-0.5,  1.5),
		vec2( 0.5,  1.5),
		vec2( 1.5,  1.5),
    );

    var outputAlpha = 0.0;

	var acum = vec3(0.0);
	for (var i = 0; i < 16; i++) {
		var neighborUV = neighbors[i] * settings.invResolution + inputUV;

        var sampledColor = textureSample(tex, linearSampler, neighborUV).rgb;

		acum += sampledColor * 0.0625;
	}

    return vec4(acum, outputAlpha);
}