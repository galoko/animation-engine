precision highp float;

varying highp vec2 texCoord;
varying highp vec3 normal;

uniform sampler2D texture;

void main(void) {
    vec3 lightDir = normalize(vec3(0.656, 0.3, 0.14));
    vec3 lightColor = vec3(1.0);

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    float ambient = 0.5;
    vec3 objectColor = texture2D(texture, texCoord).rgb;
    vec3 result = min(ambient + diffuse, 1.0) * objectColor;

    gl_FragColor = vec4(result, 1.0);
}