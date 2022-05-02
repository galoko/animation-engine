precision highp float;

varying highp vec2 texCoord;
varying highp vec3 normal;

uniform sampler2D texture;
uniform float useTexture;
uniform vec4 color;

void main(void) {
    vec3 lightDir = normalize(vec3(0.656, 0.3, 0.14));
    vec3 lightColor = vec3(1.0);

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    float ambient = 0.5;
    vec4 objectColor = useTexture > 0.5 ? texture2D(texture, texCoord) : color;
    gl_FragColor = vec4(min(ambient + diffuse, 1.0) * objectColor.rgb, objectColor.a);
}