#pragma once

#include <memory>
#include <vector>

#include "../random.hpp"
#include "simplex-noise.hpp"

using namespace std;

class PerlinSimplexNoise {
private:
    vector<unique_ptr<SimplexNoise>> noiseLevels;
    double highestFreqValueFactor, highestFreqInputFactor;

public:
    PerlinSimplexNoise(){};
    PerlinSimplexNoise(shared_ptr<RandomSource> randomSource, vector<int32_t> octaves);

    double getValue(double x, double y, bool useOffset);
};