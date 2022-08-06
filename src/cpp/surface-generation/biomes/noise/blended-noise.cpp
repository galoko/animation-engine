#include "blended-noise.hpp"

// IntStream

vector<int32_t> IntStream::rangeClosed(int32_t startInclusive, int32_t endInclusive) {
    vector<int32_t> result = vector<int32_t>();

    for (int32_t i = startInclusive; i <= endInclusive; i++) {
        result.push_back(i);
    }

    return result;
}

// BlendedNoise

BlendedNoise::BlendedNoise(BlendedNoiseInput const& blendedNoiseInput, NoiseSamplingSettings const &settings, int32_t cellWidth,
                           int32_t cellHeight)
    : minLimitNoise(blendedNoiseInput.minLimitNoise), maxLimitNoise(blendedNoiseInput.maxLimitNoise), mainNoise(blendedNoiseInput.mainNoise) {
    this->xzScale = 684.412 * settings.xzScale;
    this->yScale = 684.412 * settings.yScale;
    this->xzMainScale = this->xzScale / settings.xzFactor;
    this->yMainScale = this->yScale / settings.yFactor;
    this->cellWidth = cellWidth;
    this->cellHeight = cellHeight;
}

BlendedNoiseInput makeBlendedNoiseInput(shared_ptr<RandomSource> randomSource) {
    BlendedNoiseInput input;

    input.minLimitNoise = PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-15, 0));
    input.maxLimitNoise = PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-15, 0));
    input.mainNoise = PerlinNoise::createLegacyForBlendedNoise(randomSource, IntStream::rangeClosed(-7, 0));

    return input;
}

BlendedNoise::BlendedNoise(shared_ptr<RandomSource> randomSource, NoiseSamplingSettings const &settings,
                           int32_t cellWidth, int32_t cellHeight)
    : BlendedNoise(makeBlendedNoiseInput(randomSource), settings, cellWidth, cellHeight) {
}

double BlendedNoise::calculateNoise(int32_t x, int32_t y, int32_t z) const {
    int32_t cellX = Mth::floorDiv(x, this->cellWidth);
    int32_t cellY = Mth::floorDiv(y, this->cellHeight);
    int32_t cellZ = Mth::floorDiv(z, this->cellWidth);
    double minNoiseValue = 0.0;
    double maxNoiseValue = 0.0;
    double noiseValue = 0.0;
    double scale = 1.0;

    for (int32_t octave = 0; octave < 8; ++octave) {
        shared_ptr<ImprovedNoise> improvedNoise = this->mainNoise.getOctaveNoise(octave);
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

    for (int32_t octave = 0; octave < 16; ++octave) {
        double x = PerlinNoise::wrap((double)cellX * this->xzScale * scale);
        double y = PerlinNoise::wrap((double)cellY * this->yScale * scale);
        double z = PerlinNoise::wrap((double)cellZ * this->xzScale * scale);
        double yScale = this->yScale * scale;
        if (!isMaxOrHigher) {
            shared_ptr<ImprovedNoise> improvedNoise = this->minLimitNoise.getOctaveNoise(octave);
            if (improvedNoise != nullptr) {
                minNoiseValue += improvedNoise->noise(x, y, z, yScale, (double)cellY * yScale) / scale;
            }
        }

        if (!isMinOrLower) {
            shared_ptr<ImprovedNoise> improvedNoise = this->maxLimitNoise.getOctaveNoise(octave);
            if (improvedNoise != nullptr) {
                maxNoiseValue += improvedNoise->noise(x, y, z, yScale, (double)cellY * yScale) / scale;
            }
        }

        scale /= 2.0;
    }

    return Mth::clampedLerp(minNoiseValue / 512.0, maxNoiseValue / 512.0, t) / 128.0;
}