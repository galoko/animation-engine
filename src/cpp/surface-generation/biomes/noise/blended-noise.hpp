#pragma once

#include "../chunk-generator.hpp"
#include "../noise-chunk.hpp"
#include "perlin-noise.hpp"

class IntStream {
public:
    static vector<int> *rangeClosed(int startInclusive, int endInclusive) {
        vector<int> *result = new vector<int>();

        for (int i = startInclusive; i <= endInclusive; i++) {
            result->push_back(i);
        }

        return result;
    }
};

class BlendedNoise : public NoiseChunk::NoiseFiller {
private:
    PerlinNoise *minLimitNoise;
    PerlinNoise *maxLimitNoise;
    PerlinNoise *mainNoise;
    double xzScale;
    double yScale;
    double xzMainScale;
    double yMainScale;
    int cellWidth;
    int cellHeight;

    BlendedNoise(PerlinNoise *minLimitNoise, PerlinNoise *maxLimitNoise, PerlinNoise *mainNoise,
                 NoiseSamplingSettings *settings, int cellWidth, int cellHeight) {
        this->minLimitNoise = minLimitNoise;
        this->maxLimitNoise = maxLimitNoise;
        this->mainNoise = mainNoise;
        this->xzScale = 684.412 * settings->xzScale;
        this->yScale = 684.412 * settings->yScale;
        this->xzMainScale = this->xzScale / settings->xzFactor;
        this->yMainScale = this->yScale / settings->yFactor;
        this->cellWidth = cellWidth;
        this->cellHeight = cellHeight;
    }

public:
    BlendedNoise(RandomSource *randomSource, NoiseSamplingSettings *settings, int cellWidth, int cellHeight) {
        BlendedNoise(PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-15, 0)),
                     PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-15, 0)),
                     PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-7, 0)), settings,
                     cellWidth, cellHeight);
    }

    double calculateNoise(int x, int y, int z) {
        int cellX = Mth::floorDiv(x, this->cellWidth);
        int cellY = Mth::floorDiv(y, this->cellHeight);
        int cellZ = Mth::floorDiv(z, this->cellWidth);
        double minNoiseValue = 0.0;
        double maxNoiseValue = 0.0;
        double noiseValue = 0.0;
        double scale = 1.0;

        for (int octave = 0; octave < 8; ++octave) {
            ImprovedNoise *improvedNoise = this->mainNoise->getOctaveNoise(octave);
            if (improvedNoise != nullptr) {
                noiseValue += improvedNoise->noise(PerlinNoise::wrap((double)cellX * this->xzMainScale * scale),
                                                   PerlinNoise::wrap((double)cellY * this->yMainScale * scale),
                                                   PerlinNoise::wrap((double)cellZ * this->xzMainScale * scale),
                                                   this->yMainScale * scale, (double)cellY * this->yMainScale * scale) /
                              scale;
            }

            scale /= 2.0;
        }

        double t = (noiseValue / 10.0 + 1.0) / 2.0;
        bool isMaxOrHigher = t >= 1.0;
        bool isMinOrLower = t <= 0.0;
        scale = 1.0;

        for (int octave = 0; octave < 16; ++octave) {
            double x = PerlinNoise::wrap((double)cellX * this->xzScale * scale);
            double y = PerlinNoise::wrap((double)cellY * this->yScale * scale);
            double z = PerlinNoise::wrap((double)cellZ * this->xzScale * scale);
            double yScale = this->yScale * scale;
            if (!isMaxOrHigher) {
                ImprovedNoise *improvedNoise = this->minLimitNoise->getOctaveNoise(octave);
                if (improvedNoise != nullptr) {
                    minNoiseValue += improvedNoise->noise(x, y, z, yScale, (double)cellY * yScale) / scale;
                }
            }

            if (!isMinOrLower) {
                ImprovedNoise *improvedNoise = this->maxLimitNoise->getOctaveNoise(octave);
                if (improvedNoise != nullptr) {
                    maxNoiseValue += improvedNoise->noise(x, y, z, yScale, (double)cellY * yScale) / scale;
                }
            }

            scale /= 2.0;
        }

        return Mth::clampedLerp(minNoiseValue / 512.0, maxNoiseValue / 512.0, t) / 128.0;
    }
};