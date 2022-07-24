#pragma once

#include "../noise-chunk.hpp"
#include "perlin-noise.hpp"

class IntStream {
public:
    static vector<int32_t> rangeClosed(int32_t startInclusive, int32_t endInclusive);
};

class NoiseSamplingSettings {
public:
    double xzScale, yScale, xzFactor, yFactor;

    NoiseSamplingSettings(double xzScale, double yScale, double xzFactor, double yFactor)
        : xzScale(xzScale), yScale(yScale), xzFactor(xzFactor), yFactor(yFactor) {
    }
};

class BlendedNoise {
private:
    PerlinNoise minLimitNoise;
    PerlinNoise maxLimitNoise;
    PerlinNoise mainNoise;
    double xzScale;
    double yScale;
    double xzMainScale;
    double yMainScale;
    int32_t cellWidth;
    int32_t cellHeight;

    BlendedNoise(PerlinNoise const &minLimitNoise, PerlinNoise const &maxLimitNoise, PerlinNoise const &mainNoise,
                 NoiseSamplingSettings const &settings, int32_t cellWidth, int32_t cellHeight);

public:
    BlendedNoise() {
    }

    BlendedNoise(shared_ptr<RandomSource> randomSource, NoiseSamplingSettings const &settings, int32_t cellWidth,
                 int32_t cellHeight);

    double calculateNoise(int32_t x, int32_t y, int32_t z) const;
};