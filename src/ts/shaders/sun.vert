#version 300 es

layout(location = 0) in vec3 inputPosition;
layout(location = 1) in vec4 inputColor;
layout(location = 2) in vec2 inputUV;

layout(std140) uniform settings {
    mat4 vp;
};

out highp vec4 vertColor;
out highp vec2 vertUV;

void main(void) {
    vec4 pos = vp * vec4(inputPosition, 1.0);
    pos.w = pos.z;
    // max in depth
    gl_Position = pos;

    vertUV = inputUV;

    vec3 rWeight = vec3(0.327245563268662, 0.148633718490601, 0.0669654905796051);
    vec3 gWeight = vec3(0, 0, 0);
    vec3 bWeight = vec3(0, 0, 0);
    float alpha = 0.833333313465118;

    vec3 tintedColor = rWeight * inputColor.r + gWeight * inputColor.g + bWeight * inputColor.b;

    vertColor = vec4(tintedColor * alpha, inputColor.a);
}