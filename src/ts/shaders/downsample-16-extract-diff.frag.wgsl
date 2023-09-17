struct Settings {
    invResolution: vec2<f32>,
    timeCoeffs: vec2<f32>,
}

@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var linearSampler: sampler; // linear, clamp
@group(0) @binding(2) var pointSampler: sampler; // point, clamp
@group(0) @binding(3) var tex: texture_2d<f32>;
@group(0) @binding(4) var prevOutput: texture_2d<f32>;

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

	var prevOutputValue = textureSample(prevOutput, pointSampler, inputUV).rg;

	var valueDelta = acum.rg - prevOutputValue;
	var multipliedDelta = valueDelta * settings.timeCoeffs;

	var savedSigns: vec2<f32>;
    savedSigns.x = select(1.0, -1.0, multipliedDelta.x < 0.0);
    savedSigns.y = select(1.0, -1.0, multipliedDelta.y < 0.0);

	var clampedDelta = clamp(abs(multipliedDelta), vec2(1.0 / 256.0), abs(valueDelta)) * savedSigns;

	return vec4(prevOutputValue + clampedDelta, acum.b, outputAlpha);
}