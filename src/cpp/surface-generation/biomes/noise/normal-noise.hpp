#pragma once

#include "perlin-noise.hpp"

using namespace std;

class NormalNoise {
private:
    static constexpr double INPUT_FACTOR = 1.0181268882175227;

    double valueFactor;
    PerlinNoise *first;
    PerlinNoise *second;

public:
    class NoiseParameters {
    public:
        int32_t firstOctave;
        vector<double> *amplitudes;

        NoiseParameters(int32_t firstOctave, vector<double> *amplitudes);
        NoiseParameters(int32_t firstOctave, double firstAmplitude, vector<double> amplitudes = {});
    };

    static NormalNoise *createLegacyNetherBiome(RandomSource *randomSource, NormalNoise::NoiseParameters *parameters);
    static NormalNoise *create(RandomSource *randomSource, NormalNoise::NoiseParameters *parameters);
    static NormalNoise *create(RandomSource *randomSource, int32_t firstOctave, vector<double> *amplitudes);

private:
    NormalNoise(RandomSource *randomSource, int32_t firstOctave, vector<double> *amplitudes, bool notLegacy);

public:
    double getValue(double x, double y, double z);
    NormalNoise::NoiseParameters *parameters();
};