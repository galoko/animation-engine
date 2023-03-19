#version 300 es

layout(location = 0) in vec3 inputPosition;
layout(location = 1) in vec3 inputNormal;
layout(location = 2) in vec2 inputUV;
layout(location = 3) in float paramsIndex;

uniform sampler2D textures[16];

layout(std140) uniform settings {
    mat4 vp;
};

out highp vec3 fragNormal;
out highp vec2 fragUV;
out highp float fragAtlasNum;

const int PARAM_TEXTURE_SIZE = 1024;

vec3 quat_transform(vec4 q, vec3 v) {
    return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main(void) {
    int iParamIndex = int(paramsIndex);
    int x = iParamIndex % PARAM_TEXTURE_SIZE;
    int y = iParamIndex / PARAM_TEXTURE_SIZE;

    vec4 quat = texelFetch(textures[0], ivec2(x, y), 0);
    vec4 translation_atlasNum = texelFetch(textures[0], ivec2(x + 1, y), 0);

    vec3 scale = vec3(quat.w);

    float s = length(quat.xyz);
    quat.w = sqrt(1.0 - s * s);

    vec3 translation = translation_atlasNum.xyz;
    float atlasNum = translation_atlasNum.w;

    fragNormal = quat_transform(quat, inputNormal);

    gl_Position = vp * vec4(quat_transform(quat, inputPosition) * scale + translation, 1.0);

    fragUV = inputUV;
    fragAtlasNum = atlasNum;
}