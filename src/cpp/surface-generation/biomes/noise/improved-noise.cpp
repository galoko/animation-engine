#include "improved-noise.hpp"

// ImprovedNoise

ImprovedNoise::ImprovedNoise(shared_ptr<RandomSource> randomSource) {
    this->xo = randomSource->nextDouble() * 256.0;
    this->yo = randomSource->nextDouble() * 256.0;
    this->zo = randomSource->nextDouble() * 256.0;

    for (int32_t i = 0; i < 256; ++i) {
        this->_p[i] = (int8_t)i;
    }

    for (int32_t k = 0; k < 256; ++k) {
        int32_t value = randomSource->nextInt(256 - k);
        int8_t temp = this->_p[k];
        this->_p[k] = this->_p[k + value];
        this->_p[k + value] = temp;
    }
}

double ImprovedNoise::noise(double x, double y, double z) const {
    return this->noise(x, y, z, 0.0, 0.0);
}

double ImprovedNoise::noise(double x, double y, double z, double yFractStep, double maxYfract) const {
    double xWithOffset = x + this->xo;
    double yWithOffset = y + this->yo;
    double zWithOffset = z + this->zo;
    int32_t intX = Mth::floor(xWithOffset);
    int32_t intY = Mth::floor(yWithOffset);
    int32_t intZ = Mth::floor(zWithOffset);
    double xFract = xWithOffset - (double)intX;
    double yFract = yWithOffset - (double)intY;
    double zFract = zWithOffset - (double)intZ;
    double yFractOffset;
    if (yFractStep != 0.0) {
        double yFractToUse;
        if (maxYfract >= 0.0 && maxYfract < yFract) {
            yFractToUse = maxYfract;
        } else {
            yFractToUse = yFract;
        }

        yFractOffset = (double)Mth::floor(yFractToUse / yFractStep + (double)1.0E-7F) * yFractStep;
    } else {
        yFractOffset = 0.0;
    }

    return this->sampleAndLerp(intX, intY, intZ, xFract, yFract - yFractOffset, zFract, yFract);
}

double ImprovedNoise::noiseWithDerivative(double x, double y, double z, double output[]) const {
    double xWithOffset = x + this->xo;
    double yWithOffset = y + this->yo;
    double zWithOffset = z + this->zo;
    int32_t intXwithOffset = Mth::floor(xWithOffset);
    int32_t intYwithOffset = Mth::floor(yWithOffset);
    int32_t intZwithOffset = Mth::floor(zWithOffset);
    double xFract = xWithOffset - (double)intXwithOffset;
    double yFract = yWithOffset - (double)intYwithOffset;
    double zFract = zWithOffset - (double)intZwithOffset;
    return this->sampleWithDerivative(intXwithOffset, intYwithOffset, intZwithOffset, xFract, yFract, zFract, output);
}

double ImprovedNoise::gradDot(int32_t gradintIndex, double x, double y, double z) {
    return SimplexNoise::dot(SimplexNoise::GRADIENT[gradintIndex & 15], x, y, z);
}

int32_t ImprovedNoise::p(int32_t index) const {
    return this->_p[index & 255] & 255;
}

double ImprovedNoise::sampleAndLerp(int32_t x, int32_t y, int32_t z, double xt, double yt, double zt,
                                    double yt2) const {
    int32_t noiseX0 = this->p(x);
    int32_t noiseX1 = this->p(x + 1);
    int32_t noiseY00 = this->p(noiseX0 + y);
    int32_t noiseY01 = this->p(noiseX0 + y + 1);
    int32_t noiseY10 = this->p(noiseX1 + y);
    int32_t noiseY11 = this->p(noiseX1 + y + 1);
    // cube 2x2x2
    double len0 = gradDot(this->p(noiseY00 + z), xt, yt, zt);
    double len1 = gradDot(this->p(noiseY10 + z), xt - 1.0, yt, zt);
    double len2 = gradDot(this->p(noiseY01 + z), xt, yt - 1.0, zt);
    double len3 = gradDot(this->p(noiseY11 + z), xt - 1.0, yt - 1.0, zt);
    double len4 = gradDot(this->p(noiseY00 + z + 1), xt, yt, zt - 1.0);
    double len5 = gradDot(this->p(noiseY10 + z + 1), xt - 1.0, yt, zt - 1.0);
    double len6 = gradDot(this->p(noiseY01 + z + 1), xt, yt - 1.0, zt - 1.0);
    double len7 = gradDot(this->p(noiseY11 + z + 1), xt - 1.0, yt - 1.0, zt - 1.0);
    double smoothXt = Mth::smoothstep(xt);
    double smoothYt = Mth::smoothstep(yt2);
    double smoothZt = Mth::smoothstep(zt);
    return Mth::lerp3(smoothXt, smoothYt, smoothZt, len0, len1, len2, len3, len4, len5, len6, len7);
}

double ImprovedNoise::sampleWithDerivative(int32_t x, int32_t y, int32_t z, double xFract, double yFract, double zFract,
                                           double output[]) const {
    int32_t noiseX0 = this->p(x);
    int32_t noiseX1 = this->p(x + 1);
    int32_t noiseY00 = this->p(noiseX0 + y);
    int32_t noiseY01 = this->p(noiseX0 + y + 1);
    int32_t noiseY10 = this->p(noiseX1 + y);
    int32_t noiseY11 = this->p(noiseX1 + y + 1);
    int32_t noiseZ000 = this->p(noiseY00 + z);
    int32_t noiseZ100 = this->p(noiseY10 + z);
    int32_t noiseZ010 = this->p(noiseY01 + z);
    int32_t noiseZ110 = this->p(noiseY11 + z);
    int32_t noiseZ001 = this->p(noiseY00 + z + 1);
    int32_t noiseZ101 = this->p(noiseY10 + z + 1);
    int32_t noiseZ011 = this->p(noiseY01 + z + 1);
    int32_t noiseZ111 = this->p(noiseY11 + z + 1);
    const int32_t *gradient0 = SimplexNoise::GRADIENT[noiseZ000 & 15];
    const int32_t *gradient1 = SimplexNoise::GRADIENT[noiseZ100 & 15];
    const int32_t *gradient2 = SimplexNoise::GRADIENT[noiseZ010 & 15];
    const int32_t *gradient3 = SimplexNoise::GRADIENT[noiseZ110 & 15];
    const int32_t *gradient4 = SimplexNoise::GRADIENT[noiseZ001 & 15];
    const int32_t *gradient5 = SimplexNoise::GRADIENT[noiseZ101 & 15];
    const int32_t *gradient6 = SimplexNoise::GRADIENT[noiseZ011 & 15];
    const int32_t *gradient7 = SimplexNoise::GRADIENT[noiseZ111 & 15];
    double len0 = SimplexNoise::dot(gradient0, xFract, yFract, zFract);
    double len1 = SimplexNoise::dot(gradient1, xFract - 1.0, yFract, zFract);
    double len2 = SimplexNoise::dot(gradient2, xFract, yFract - 1.0, zFract);
    double len3 = SimplexNoise::dot(gradient3, xFract - 1.0, yFract - 1.0, zFract);
    double len4 = SimplexNoise::dot(gradient4, xFract, yFract, zFract - 1.0);
    double len5 = SimplexNoise::dot(gradient5, xFract - 1.0, yFract, zFract - 1.0);
    double len6 = SimplexNoise::dot(gradient6, xFract, yFract - 1.0, zFract - 1.0);
    double len7 = SimplexNoise::dot(gradient7, xFract - 1.0, yFract - 1.0, zFract - 1.0);
    double smoothXfract = Mth::smoothstep(xFract);
    double smoothYfract = Mth::smoothstep(yFract);
    double smoothZfract = Mth::smoothstep(zFract);
    double interpolatedGradientX = Mth::lerp3(
        smoothXfract, smoothYfract, smoothZfract, (double)gradient0[0], (double)gradient1[0], (double)gradient2[0],
        (double)gradient3[0], (double)gradient4[0], (double)gradient5[0], (double)gradient6[0], (double)gradient7[0]);
    double interpolatedGradientY = Mth::lerp3(
        smoothXfract, smoothYfract, smoothZfract, (double)gradient0[1], (double)gradient1[1], (double)gradient2[1],
        (double)gradient3[1], (double)gradient4[1], (double)gradient5[1], (double)gradient6[1], (double)gradient7[1]);
    double interpolatedGradientZ = Mth::lerp3(
        smoothXfract, smoothYfract, smoothZfract, (double)gradient0[2], (double)gradient1[2], (double)gradient2[2],
        (double)gradient3[2], (double)gradient4[2], (double)gradient5[2], (double)gradient6[2], (double)gradient7[2]);
    double xLen = Mth::lerp2(smoothYfract, smoothZfract, len1 - len0, len3 - len2, len5 - len4, len7 - len6);
    double yLen = Mth::lerp2(smoothZfract, smoothXfract, len2 - len0, len6 - len4, len3 - len1, len7 - len5);
    double zLen = Mth::lerp2(smoothXfract, smoothYfract, len4 - len0, len5 - len1, len6 - len2, len7 - len3);
    double xDerivSmooth = Mth::smoothstepDerivative(xFract);
    double yDerivSmooth = Mth::smoothstepDerivative(yFract);
    double zDerivSmooth = Mth::smoothstepDerivative(zFract);
    double outputX = interpolatedGradientX + xDerivSmooth * xLen;
    double outputY = interpolatedGradientY + yDerivSmooth * yLen;
    double outputZ = interpolatedGradientZ + zDerivSmooth * zLen;
    output[0] += outputX;
    output[1] += outputY;
    output[2] += outputZ;
    return Mth::lerp3(smoothXfract, smoothYfract, smoothZfract, len0, len1, len2, len3, len4, len5, len6, len7);
}