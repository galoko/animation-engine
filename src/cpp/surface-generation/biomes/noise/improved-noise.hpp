#pragma once

#include <cstdint>

#include "../mth.hpp"
#include "../random.hpp"
#include "simplex-noise.hpp"

class ImprovedNoise {
private:
    static constexpr float SHIFT_UP_EPSILON = 1.0E-7F;
    int8_t _p[256];

public:
    double xo, yo, zo;

    ImprovedNoise(RandomSource *randomSource);

    double noise(double x, double y, double z);
    double noise(double x, double y, double z, double yFractStep, double maxYfract);
    double noiseWithDerivative(double x, double y, double z, double output[]);

private:
    static double gradDot(int32_t gradintIndex, double x, double y, double z);

    int32_t p(int32_t index);

    double sampleAndLerp(int32_t x, int32_t y, int32_t z, double xt, double yt, double zt, double yt2);
    double sampleWithDerivative(int32_t x, int32_t y, int32_t z, double xFract, double yFract, double zFract,
                                double output[]);
};