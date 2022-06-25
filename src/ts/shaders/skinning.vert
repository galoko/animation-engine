attribute vec3 p;
attribute vec3 n;
attribute vec2 uv;

attribute vec4 w;
attribute vec4 j;

uniform mat4 mvp;
uniform sampler2D matrices;

varying highp vec2 texCoord;
varying highp vec3 normal;

mat4 getJointMatrix(float j) {
    float v0 = (j * 4.0 + 0.5) / 1024.0;
    float v1 = (j * 4.0 + 1.5) / 1024.0;
    float v2 = (j * 4.0 + 2.5) / 1024.0;
    float v3 = (j * 4.0 + 3.5) / 1024.0;

    vec4 p0 = texture2D(matrices, vec2(v0, 0.5));
    vec4 p1 = texture2D(matrices, vec2(v1, 0.5));
    vec4 p2 = texture2D(matrices, vec2(v2, 0.5));
    vec4 p3 = texture2D(matrices, vec2(v3, 0.5));

    return mat4(p0, p1, p2, p3);
}

void main(void) {
    mat4 skinningMatrix =
        getJointMatrix(j[0]) * w[0] +
        getJointMatrix(j[1]) * w[1] +
        getJointMatrix(j[2]) * w[2] +
        getJointMatrix(j[3]) * w[3];

    gl_Position = mvp * skinningMatrix * vec4(p, 1.0);

    texCoord = uv;
    normal = (skinningMatrix * vec4(n, 0.0)).xyz;
}