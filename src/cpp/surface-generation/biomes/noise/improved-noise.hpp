#pragma once

#include <cstdint>
#include <memory>

#include "../../../utils/memory-debug.hpp"
#include "../mth.hpp"
#include "../random.hpp"
#include "simplex-noise.hpp"

class ImprovedNoise {
private:
    static constexpr float SHIFT_UP_EPSILON = 1.0E-7F;
    int8_t _p[256];

public:
    double xo, yo, zo;

    ImprovedNoise(shared_ptr<RandomSource> randomSource);

    virtual ~ImprovedNoise() {
        objectFreed("ImprovedNoise");
    }

    double noise(double x, double y, double z) const;
    double noise(double x, double y, double z, double yFractStep, double maxYfract) const;
    double noiseWithDerivative(double x, double y, double z, double output[]) const;

private:
    static double gradDot(int32_t gradintIndex, double x, double y, double z);

    int32_t p(int32_t index) const;

    double sampleAndLerp(int32_t x, int32_t y, int32_t z, double xt, double yt, double zt, double yt2) const;
    double sampleWithDerivative(int32_t x, int32_t y, int32_t z, double xFract, double yFract, double zFract,
                                double output[]) const;
};