attribute vec3 p;
attribute vec3 n;
attribute vec2 uv;

uniform mat4 mvp;
uniform mat4 model;
uniform float texMul;

varying highp vec2 texCoord;
varying highp vec3 normal;

void main(void) {
    gl_Position = mvp * vec4(p, 1.0);

    texCoord = uv * texMul;
    normal = (model * vec4(n, 0.0)).xyz;
}