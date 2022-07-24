#pragma once

#include "perlin-noise.hpp"

using namespace std;

class NormalNoise {
private:
    static constexpr double INPUT_FACTOR = 1.0181268882175227;

    double valueFactor;
    PerlinNoise first;
    PerlinNoise second;

public:
    class NoiseParameters {
    public:
        int32_t firstOctave;
        vector<double> amplitudes;

        NoiseParameters() {
        }

        NoiseParameters(int32_t firstOctave, vector<double> const &amplitudes);
        NoiseParameters(int32_t firstOctave, double firstAmplitude,
                        vector<double> const &amplitudes = vector<double>());
    };

    static NormalNoise createLegacyNetherBiome(shared_ptr<RandomSource> randomSource,
                                               NormalNoise::NoiseParameters const &parameters);
    static NormalNoise create(shared_ptr<RandomSource> randomSource, NormalNoise::NoiseParameters const &parameters);
    static NormalNoise create(shared_ptr<RandomSource> randomSource, int32_t firstOctave,
                              vector<double> const &amplitudes);

private:
    NormalNoise(shared_ptr<RandomSource> randomSource, int32_t firstOctave, vector<double> const &amplitudes,
                bool notLegacy);

public:
    NormalNoise() {
    }

    double getValue(double x, double y, double z) const;
};