#include "normal-noise.hpp"

double expectedDeviation(int32_t v) {
    return 0.1 * (1.0 + 1.0 / (double)(v + 1));
}

// NormalNoise

NormalNoise NormalNoise::createLegacyNetherBiome(RandomSource *randomSource,
                                                 NormalNoise::NoiseParameters const &parameters) {
    return NormalNoise(randomSource, parameters.firstOctave, parameters.amplitudes, false);
}

NormalNoise NormalNoise::create(RandomSource *randomSource, NormalNoise::NoiseParameters const &parameters) {
    return NormalNoise(randomSource, parameters.firstOctave, parameters.amplitudes, true);
}

NormalNoise NormalNoise::create(RandomSource *randomSource, int32_t firstOctave, vector<double> const &amplitudes) {
    return NormalNoise(randomSource, firstOctave, amplitudes, true);
}

NormalNoise::NormalNoise(RandomSource *randomSource, int32_t firstOctave, vector<double> const &amplitudes,
                         bool notLegacy) {
    if (notLegacy) {
        this->first = PerlinNoise::create(randomSource, firstOctave, amplitudes);
        this->second = PerlinNoise::create(randomSource, firstOctave, amplitudes);
    } else {
        this->first = PerlinNoise::createLegacyForLegacyNormalNoise(randomSource, firstOctave, amplitudes);
        this->second = PerlinNoise::createLegacyForLegacyNormalNoise(randomSource, firstOctave, amplitudes);
    }

    int32_t minAmplitudeIndex = numeric_limits<int32_t>::max();
    int32_t maxAmplitudeIndex = numeric_limits<int32_t>::lowest();

    for (int32_t amplitudeIndex = 0; amplitudeIndex < amplitudes.size(); amplitudeIndex++) {
        double amplitude = amplitudes.at(amplitudeIndex);
        if (amplitude != 0.0) {
            minAmplitudeIndex = min(minAmplitudeIndex, amplitudeIndex);
            maxAmplitudeIndex = max(maxAmplitudeIndex, amplitudeIndex);
        }
    }

    this->valueFactor = 0.16666666666666666 / expectedDeviation(maxAmplitudeIndex - minAmplitudeIndex);
}

double NormalNoise::getValue(double x, double y, double z) const {
    double inputX = x * INPUT_FACTOR;
    double inputY = y * INPUT_FACTOR;
    double inputZ = z * INPUT_FACTOR;
    return (this->first->getValue(x, y, z) + this->second->getValue(inputX, inputY, inputZ)) * this->valueFactor;
}

// NoiseParameters

NormalNoise::NoiseParameters::NoiseParameters(int32_t firstOctave, vector<double> const &amplitudes) {
    this->firstOctave = firstOctave;
    this->amplitudes = amplitudes;
}

NormalNoise::NoiseParameters::NoiseParameters(int32_t firstOctave, double firstAmplitude,
                                              vector<double> const &amplitudes) {
    this->firstOctave = firstOctave;
    this->amplitudes = vector<double>();
    this->amplitudes.reserve(1 + amplitudes.size());
    this->amplitudes.insert(this->amplitudes.begin(), firstAmplitude);
    this->amplitudes.insert(this->amplitudes.begin() + 1, amplitudes.begin(), amplitudes.end());
}