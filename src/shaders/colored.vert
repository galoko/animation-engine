attribute vec3 p;
attribute vec3 c;

uniform mat4 mvp;
varying highp vec3 color;

void main(void) {
    gl_Position = mvp * vec4(p, 1.0);

    color = c;
}