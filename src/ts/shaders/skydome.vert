#version 300 es

layout(location = 0) in vec3 inputPosition;
layout(location = 1) in vec4 inputColor;

layout(std140) uniform settings {
    mat4 vp;
};

out highp vec4 vertColor;

void main(void) {
    vec4 pos = vp * vec4(inputPosition, 1.0);
    pos.z = pos.w;
    // max in depth
    gl_Position = pos;

    vec3 rWeight = vec3(0.391360133886337, 0.386311918497086, 0.389162868261337);
    vec3 gWeight = vec3(0.398082792758942, 0.398599475622177, 0.403697550296783);
    vec3 bWeight = vec3(0.140491753816605, 0.252542823553085, 0.296034902334213);
    float alpha = 0.833333313465118;

    vec3 tintedColor = rWeight * inputColor.r + gWeight * inputColor.g + bWeight * inputColor.b;

    vertColor = vec4(tintedColor * alpha, inputColor.a);
}