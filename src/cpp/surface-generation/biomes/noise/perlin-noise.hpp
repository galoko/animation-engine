#pragma once

#include <utility>
#include <vector>

#include "improved-noise.hpp"

using namespace std;

class PerlinNoise {
private:
    vector<ImprovedNoise *> noiseLevels;
    double lowestFreqValueFactor;
    double lowestFreqInputFactor;

public:
    int32_t firstOctave;
    vector<double> amplitudes;

    static PerlinNoise createLegacyForBlendedNoise(RandomSource *randomSource, vector<int32_t> const &octaves);
    static PerlinNoise *createLegacyForLegacyNormalNoise(RandomSource *randomSource, int32_t firstOctave,
                                                         vector<double> const &amplitudes);

    static PerlinNoise *create(RandomSource *randomSource, vector<int32_t> const &octaves);
    static PerlinNoise *create(RandomSource *randomSource, int32_t firstOctave, vector<double> const &amplitudes);

private:
    static pair<int32_t, vector<double>> makeAmplitudes(vector<int32_t> const &octaves);

public:
    PerlinNoise() {
    }

    PerlinNoise(RandomSource *randomSource, pair<int32_t, vector<double>> const &octaveAndAmplitudes, bool notLegacy);

private:
    static void skipOctave(RandomSource *randomSource);

public:
    double getValue(double x, double y, double z) const;
    double getValue(double x, double y, double z, double yStep, double maxYfract, bool useYfractOverride) const;

    ImprovedNoise *getOctaveNoise(int32_t octave) const;

    static constexpr inline double wrap(double num) {
        return num - (double)Mth::lfloor(num / 3.3554432E7 + 0.5) * 3.3554432E7;
    }
};