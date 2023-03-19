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
    pos.z = pos.w;
    // max in depth
    gl_Position = pos;

    vec3 rWeight = vec3(0.565203845500946, 0.228658571839333, 0.0142048010602593);
    float alpha = 0.833333313465118;

    vec3 tintedColor = rWeight * inputColor.r;

    vertColor = vec4(tintedColor * alpha, inputColor.a);

    vertUV = inputUV;
}