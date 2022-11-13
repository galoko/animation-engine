#version 300 es

precision highp float;

in highp vec3 fragNormal;
in vec2 fragUV;

out vec4 outputColor;

uniform sampler2D textures[16];

float GetMipLevel(vec2 UV)
{
	vec2 dx = dFdx(UV);
	vec2 dy = dFdy(UV);
	float d = max(dot(dx, dx), dot(dy, dy));
	return clamp(0.5 * log2(d), 0.0, 5.0); // 5 mipmap level is max level, which is 32x32 texture 
}

const float ATLAS_SIZE = 2048.0;

void main(void) {
    vec3 lightDir = normalize(vec3(0.656, 0.3, 0.14));
    vec3 lightColor = vec3(1.);

    float diff = max(dot(fragNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    float ambient = 0.5;
    // TODO use atlasNum somehow
    float mipLevel = GetMipLevel(fragUV * ATLAS_SIZE);
    float mipMul = pow(2., mipLevel);
    vec2 mipMapPadding = vec2(0.5 / ATLAS_SIZE * mipMul);

    vec2 minUV = vec2(0.0, 0.0) / ATLAS_SIZE + mipMapPadding;
    vec2 maxUV = vec2(512.0, 512.0) / ATLAS_SIZE - mipMapPadding;

    vec4 objectColor = textureLod(textures[1], clamp(fragUV, minUV, maxUV), mipLevel);

    outputColor = vec4(min(ambient + diffuse, 1.0) * objectColor.rgb, objectColor.a);
}