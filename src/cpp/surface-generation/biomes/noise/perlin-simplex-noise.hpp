#pragma once

#include <vector>

#include "../random.hpp"
#include "simplex-noise.hpp"

using namespace std;

class PerlinSimplexNoise {
private:
    vector<SimplexNoise *> noiseLevels;
    double highestFreqValueFactor, highestFreqInputFactor;

public:
    PerlinSimplexNoise(RandomSource *randomSource, vector<int32_t> octaves);

    double getValue(double x, double y, bool useOffset);
};