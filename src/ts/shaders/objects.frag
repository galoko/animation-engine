#version 300 es

precision highp float;

in highp vec3 fragNormal;
in highp vec2 fragUV;
in highp float fragAtlasNum;

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
    float mipLevel = GetMipLevel(fragUV * ATLAS_SIZE);
    float mipMul = pow(2., mipLevel);
    vec2 mipMapPadding = vec2(0.5 / ATLAS_SIZE * mipMul);

    // we need 
    vec2 minUV = vec2(0.0, 0.0) / ATLAS_SIZE + mipMapPadding;
    vec2 maxUV = vec2(128.0, 128.0) / ATLAS_SIZE - mipMapPadding;

    // vec4 objectColor = textureLod(textures[1], clamp(fragUV, minUV, maxUV), mipLevel);
    vec4 objectColor;
    if (fragAtlasNum < 0.5) {
        objectColor = textureLod(textures[1], fragUV, mipLevel);
    } else if (fragAtlasNum < 1.5) {
        objectColor = textureLod(textures[2], fragUV, mipLevel);
    } else if (fragAtlasNum < 2.5) {
        objectColor = textureLod(textures[3], fragUV, mipLevel);
    } else if (fragAtlasNum < 3.5) {
        objectColor = textureLod(textures[4], fragUV, mipLevel);
    } else if (fragAtlasNum < 4.5) {
        objectColor = textureLod(textures[5], fragUV, mipLevel);
    } else if (fragAtlasNum < 5.5) {
        objectColor = textureLod(textures[6], fragUV, mipLevel);
    } else if (fragAtlasNum < 6.5) {
        objectColor = textureLod(textures[7], fragUV, mipLevel);
    } else if (fragAtlasNum < 7.5) {
        objectColor = textureLod(textures[8], fragUV, mipLevel);
    } else if (fragAtlasNum < 8.5) {
        objectColor = textureLod(textures[9], fragUV, mipLevel);
    } else if (fragAtlasNum < 9.5) {
        objectColor = textureLod(textures[10], fragUV, mipLevel);
    } else if (fragAtlasNum < 10.5) {
        objectColor = textureLod(textures[11], fragUV, mipLevel);
    } else if (fragAtlasNum < 11.5) {
        objectColor = textureLod(textures[12], fragUV, mipLevel);
    } else if (fragAtlasNum < 12.5) {
        objectColor = textureLod(textures[13], fragUV, mipLevel);
    } else if (fragAtlasNum < 13.5) {
        objectColor = textureLod(textures[14], fragUV, mipLevel);
    } else if (fragAtlasNum < 14.5) {
        objectColor = textureLod(textures[15], fragUV, mipLevel);
    }

    outputColor = vec4(min(ambient + diffuse, 1.0) * objectColor.rgb, objectColor.a);
}