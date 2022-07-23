#include "perlin-simplex-noise.hpp"

bool contains(vector<int32_t> const &vec, int32_t item) {
    return find(vec.begin(), vec.end(), item) != vec.end();
}

PerlinSimplexNoise::PerlinSimplexNoise(RandomSource *randomSource, vector<int32_t> octaves) {
    int32_t minusFirstOctave = -octaves.front();
    int32_t lastOctave = octaves.back();
    int32_t octaveLength = minusFirstOctave + lastOctave + 1;

    SimplexNoise *simplexnoise = new SimplexNoise(randomSource);
    int32_t l = lastOctave;
    this->noiseLevels = vector<SimplexNoise *>(octaveLength);
    if (lastOctave >= 0 && lastOctave < octaveLength && contains(octaves, 0)) {
        this->noiseLevels.at(lastOctave) = simplexnoise;
    }

    for (int32_t octaveIndex = lastOctave + 1; octaveIndex < octaveLength; ++octaveIndex) {
        if (octaveIndex >= 0 && contains(octaves, l - octaveIndex)) {
            this->noiseLevels.at(octaveIndex) = new SimplexNoise(randomSource);
        } else {
            randomSource->consumeCount(262);
        }
    }

    if (lastOctave > 0) {
        int64_t seed = (int64_t)(simplexnoise->getValue(simplexnoise->xo, simplexnoise->yo, simplexnoise->zo) *
                                 (double)9.223372E18F);
        RandomSource *randomSource = new WorldgenRandom(new LegacyRandomSource(seed));

        for (int32_t octaveIndex = l - 1; octaveIndex >= 0; --octaveIndex) {
            if (octaveIndex < octaveLength && contains(octaves, l - octaveIndex)) {
                this->noiseLevels.at(octaveIndex) = new SimplexNoise(randomSource);
            } else {
                randomSource->consumeCount(262);
            }
        }
    }

    this->highestFreqInputFactor = pow(2.0, (double)lastOctave);
    this->highestFreqValueFactor = 1.0 / (pow(2.0, (double)octaveLength) - 1.0);
}

double PerlinSimplexNoise::PerlinSimplexNoise::getValue(double x, double y, bool useOffset) {
    double noiseValue = 0.0;
    double inputScale = this->highestFreqInputFactor;
    double outputScale = this->highestFreqValueFactor;

    for (SimplexNoise *&simplexnoise : this->noiseLevels) {
        if (simplexnoise != nullptr) {
            noiseValue += simplexnoise->getValue(x * inputScale + (useOffset ? simplexnoise->xo : 0.0),
                                                 y * inputScale + (useOffset ? simplexnoise->yo : 0.0)) *
                          outputScale;
        }

        inputScale /= 2.0;
        outputScale *= 2.0;
    }

    return noiseValue;
}
