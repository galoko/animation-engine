#include "simplex-noise.hpp"

SimplexNoise::SimplexNoise(RandomSource *randomSource) {
    this->xo = randomSource->nextDouble() * 256.0;
    this->yo = randomSource->nextDouble() * 256.0;
    this->zo = randomSource->nextDouble() * 256.0;

    for (int32_t i = 0; i < 256; this->_p[i] = i++) {
    }

    for (int32_t i = 0; i < 256; ++i) {
        int32_t value = randomSource->nextInt(256 - i);
        int32_t temp = this->_p[i];
        this->_p[i] = this->_p[value + i];
        this->_p[value + i] = temp;
    }
}

int32_t SimplexNoise::p(int32_t index) {
    return this->_p[index & 255];
}

double SimplexNoise::dot(const int32_t v[], double x, double y, double z) {
    return (double)v[0] * x + (double)v[1] * y + (double)v[2] * z;
}

double SimplexNoise::getCornerNoise3D(int32_t gradintIndex, double x, double y, double z, double maxLengthSq) {
    double lengthDiff = maxLengthSq - x * x - y * y - z * z;
    double result;
    if (lengthDiff < 0.0) {
        result = 0.0;
    } else {
        lengthDiff *= lengthDiff;
        result = lengthDiff * lengthDiff * dot(GRADIENT[gradintIndex], x, y, z);
    }

    return result;
}

double SimplexNoise::getValue(double x, double y) {
    double d0 = (x + y) * F2;
    int32_t i = Mth::floor(x + d0);
    int32_t j = Mth::floor(y + d0);
    double d1 = (double)(i + j) * G2;
    double d2 = (double)i - d1;
    double d3 = (double)j - d1;
    double d4 = x - d2;
    double d5 = y - d3;
    int32_t k;
    int32_t l;
    if (d4 > d5) {
        k = 1;
        l = 0;
    } else {
        k = 0;
        l = 1;
    }

    double d6 = d4 - (double)k + G2;
    double d7 = d5 - (double)l + G2;
    double d8 = d4 - 1.0 + 2.0 * G2;
    double d9 = d5 - 1.0 + 2.0 * G2;
    int32_t i1 = i & 255;
    int32_t j1 = j & 255;
    int32_t k1 = this->p(i1 + this->p(j1)) % 12;
    int32_t l1 = this->p(i1 + k + this->p(j1 + l)) % 12;
    int32_t i2 = this->p(i1 + 1 + this->p(j1 + 1)) % 12;
    double d10 = this->getCornerNoise3D(k1, d4, d5, 0.0, 0.5);
    double d11 = this->getCornerNoise3D(l1, d6, d7, 0.0, 0.5);
    double d12 = this->getCornerNoise3D(i2, d8, d9, 0.0, 0.5);
    return 70.0 * (d10 + d11 + d12);
}

double SimplexNoise::getValue(double x, double y, double z) {
    double ONE_THIRD = 0.3333333333333333;
    double ONE_SIXTH = 0.16666666666666666;

    double d1 = (x + y + z) * ONE_THIRD;
    int32_t i = Mth::floor(x + d1);
    int32_t j = Mth::floor(y + d1);
    int32_t k = Mth::floor(z + d1);
    double d3 = (double)(i + j + k) * ONE_SIXTH;
    double d4 = (double)i - d3;
    double d5 = (double)j - d3;
    double d6 = (double)k - d3;
    double d7 = x - d4;
    double d8 = y - d5;
    double d9 = z - d6;
    int32_t l;
    int32_t i1;
    int32_t j1;
    int32_t k1;
    int32_t l1;
    int32_t i2;
    if (d7 >= d8) {
        if (d8 >= d9) {
            l = 1;
            i1 = 0;
            j1 = 0;
            k1 = 1;
            l1 = 1;
            i2 = 0;
        } else if (d7 >= d9) {
            l = 1;
            i1 = 0;
            j1 = 0;
            k1 = 1;
            l1 = 0;
            i2 = 1;
        } else {
            l = 0;
            i1 = 0;
            j1 = 1;
            k1 = 1;
            l1 = 0;
            i2 = 1;
        }
    } else if (d8 < d9) {
        l = 0;
        i1 = 0;
        j1 = 1;
        k1 = 0;
        l1 = 1;
        i2 = 1;
    } else if (d7 < d9) {
        l = 0;
        i1 = 1;
        j1 = 0;
        k1 = 0;
        l1 = 1;
        i2 = 1;
    } else {
        l = 0;
        i1 = 1;
        j1 = 0;
        k1 = 1;
        l1 = 1;
        i2 = 0;
    }

    double d10 = d7 - (double)l + ONE_SIXTH;
    double d11 = d8 - (double)i1 + ONE_SIXTH;
    double d12 = d9 - (double)j1 + ONE_SIXTH;
    double d13 = d7 - (double)k1 + ONE_THIRD;
    double d14 = d8 - (double)l1 + ONE_THIRD;
    double d15 = d9 - (double)i2 + ONE_THIRD;
    double d16 = d7 - 1.0 + 0.5;
    double d17 = d8 - 1.0 + 0.5;
    double d18 = d9 - 1.0 + 0.5;
    int32_t j2 = i & 255;
    int32_t k2 = j & 255;
    int32_t l2 = k & 255;
    int32_t i3 = this->p(j2 + this->p(k2 + this->p(l2))) % 12;
    int32_t j3 = this->p(j2 + l + this->p(k2 + i1 + this->p(l2 + j1))) % 12;
    int32_t k3 = this->p(j2 + k1 + this->p(k2 + l1 + this->p(l2 + i2))) % 12;
    int32_t l3 = this->p(j2 + 1 + this->p(k2 + 1 + this->p(l2 + 1))) % 12;
    double d19 = this->getCornerNoise3D(i3, d7, d8, d9, 0.6);
    double d20 = this->getCornerNoise3D(j3, d10, d11, d12, 0.6);
    double d21 = this->getCornerNoise3D(k3, d13, d14, d15, 0.6);
    double d22 = this->getCornerNoise3D(l3, d16, d17, d18, 0.6);
    return 32.0 * (d19 + d20 + d21 + d22);
}