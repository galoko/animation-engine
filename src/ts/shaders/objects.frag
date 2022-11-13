#version 300 es

precision highp float;

in highp vec3 fragNormal;
in vec2 fragUV;

out vec4 outputColor;

uniform sampler2D textures[16];

void main(void) {
    vec3 lightDir = normalize(vec3(0.656, 0.3, 0.14));
    vec3 lightColor = vec3(1.0);

    float diff = max(dot(fragNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    float ambient = 0.5;
    // TODO use atlasNum somehow
    vec4 objectColor = texture(textures[1], fragUV);

    outputColor = vec4(min(ambient + diffuse, 1.0) * objectColor.rgb, objectColor.a);
}