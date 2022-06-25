attribute vec3 p;
attribute vec3 n;

uniform mat4 mvp;

varying highp vec3 normal;

void main(void) {
    gl_Position = mvp * vec4(p, 1.0);
    normal = n;
}