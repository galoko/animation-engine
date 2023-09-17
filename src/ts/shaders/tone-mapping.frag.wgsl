
@group(0) @binding(0) var linearSampler: sampler; // linear, clamp
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var brightnessMap: texture_2d<f32>;

@fragment
fn main(
    @builtin(position) screenPosInPixels: vec4<f32>,
    @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
    const sunGlareMaxBrightness = 0.622557997703552;
    const brightnessMul = 0.933622539043427;
    const someFlag = 0;

    const brightnessDeltaMul = 1.5;

    const unknown_mul_0 = 1.17344582080841;
    const unknown_mul_1 = 1.45914733409882;

    const someColor_rgb = vec3(0.889478623867035, 0.651335895061493, 0.568432688713074);
    const someColor_a = 0.437744200229645;

    const logMul = 1.04166674613953;

    var sceneColor = textureLoad(scene, vec2<i32>(floor(screenPosInPixels.xy)), 0).rgb;
    var pixelBrightness = max(10e-6, dot(vec3(0.2125, 0.7154, 0.0721), sceneColor));

    var sunGlareColor = vec3(0.0, 0.0, 0.0); // TODO ?

    var brightnessMapValue = textureSample(brightnessMap, linearSampler, fragUV).xy;
    var brightnessChangeRate = brightnessMapValue.y / brightnessMapValue.x;
    var someBrightness = brightnessChangeRate * pixelBrightness;
    var someBrightnessPlusOne = 1 + someBrightness;

    var someBrightnessClamped = max(0, someBrightness - 0.004);

    var lowBrightness = (0.5 + someBrightnessClamped * 6.2) * someBrightnessClamped;
    var highBrightness = 0.06 + (1.7 + someBrightnessClamped * 6.2) * someBrightnessClamped;

    var brightness1 = exp2(2.2 * log2(lowBrightness / highBrightness)) * brightnessMul;
    var brightness2 = (someBrightness * (1 + someBrightness * brightnessMul)) / someBrightnessPlusOne;

    var chosenBrightness = select(brightness2, brightness1, someFlag >= 0.5);

    sunGlareColor = sunGlareColor * saturate(sunGlareMaxBrightness - chosenBrightness);

    var brightnessAdjustedSceneColor = sceneColor * (chosenBrightness / pixelBrightness) + sunGlareColor;

    var newBrightness = dot(brightnessAdjustedSceneColor, vec3(0.2125, 0.7154, 0.0721));

    var deltaMultipliedSceneColor =
        newBrightness + brightnessDeltaMul * (brightnessAdjustedSceneColor - newBrightness);
    var deltaMultipliedSceneColorWithSomeColor =
        deltaMultipliedSceneColor + (someColor_rgb * newBrightness - deltaMultipliedSceneColor) * someColor_a;

    var deltaMultipliedSceneColorWithSomeColorMultiplied =
        (deltaMultipliedSceneColorWithSomeColor * unknown_mul_0 - brightnessMapValue.x) * unknown_mul_1 +
        brightnessMapValue.x;

    return  vec4(exp2(logMul * log2(saturate(deltaMultipliedSceneColorWithSomeColorMultiplied))), 0);
}