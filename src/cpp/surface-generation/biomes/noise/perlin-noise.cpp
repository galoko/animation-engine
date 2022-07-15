#include "perlin-noise.hpp"

// PerlinNoise

PerlinNoise *PerlinNoise::createLegacyForBlendedNoise(RandomSource *randomSource, vector<int32_t> *octaves) {
    return new PerlinNoise(randomSource, makeAmplitudes(octaves), false);
}

PerlinNoise *PerlinNoise::createLegacyForLegacyNormalNoise(RandomSource *randomSource, int32_t firstOctave,
                                                           vector<double> *amplitudes) {
    return new PerlinNoise(randomSource, new pair(firstOctave, amplitudes), false);
}

PerlinNoise *PerlinNoise::create(RandomSource *randomSource, vector<int32_t> *octaves) {
    return new PerlinNoise(randomSource, makeAmplitudes(octaves), true);
}

PerlinNoise *PerlinNoise::create(RandomSource *randomSource, int32_t firstOctave, vector<double> *amplitudes) {
    return new PerlinNoise(randomSource, new pair(firstOctave, amplitudes), true);
}

pair<int32_t, vector<double> *> *PerlinNoise::makeAmplitudes(vector<int32_t> *octaves) {
    int32_t minusFirstOctave = -octaves->front();
    int32_t lastOctave = octaves->back();
    int32_t octaveLength = minusFirstOctave + lastOctave + 1;

    vector<double> *amplitudes = new vector<double>(octaveLength, 0.0);

    for (int32_t &l : *octaves) {
        amplitudes->at(l + minusFirstOctave) = 1.0;
    }

    return new pair(-minusFirstOctave, amplitudes);
}

PerlinNoise::PerlinNoise(RandomSource *randomSource, pair<int32_t, vector<double> *> *octaveAndAmplitudes,
                         bool notLegacy) {
    this->firstOctave = octaveAndAmplitudes->first;
    this->amplitudes = octaveAndAmplitudes->second;
    int32_t amplitudesCount = this->amplitudes->size();
    int32_t minusFirstOctave = -this->firstOctave;
    this->noiseLevels = new vector<ImprovedNoise *>(amplitudesCount);
    if (notLegacy) {
        PositionalRandomFactory *positionalrandomfactory = randomSource->forkPositional();

        for (int32_t amplitudeIndex = 0; amplitudeIndex < amplitudesCount; ++amplitudeIndex) {
            if (this->amplitudes->at(amplitudeIndex) != 0.0) {
                int32_t octave = this->firstOctave + amplitudeIndex;
                this->noiseLevels->at(amplitudeIndex) =
                    new ImprovedNoise(positionalrandomfactory->fromHashOf("octave_" + to_string(octave)));
            }
        }
    } else {
        ImprovedNoise *improvednoise = new ImprovedNoise(randomSource);
        if (minusFirstOctave >= 0 && minusFirstOctave < amplitudesCount) {
            double amplitude = this->amplitudes->at(minusFirstOctave);
            if (amplitude != 0.0) {
                this->noiseLevels->at(minusFirstOctave) = improvednoise;
            }
        }

        for (int32_t octaveIndex = minusFirstOctave - 1; octaveIndex >= 0; --octaveIndex) {
            if (octaveIndex < amplitudesCount) {
                double d1 = this->amplitudes->at(octaveIndex);
                if (d1 != 0.0) {
                    this->noiseLevels->at(octaveIndex) = new ImprovedNoise(randomSource);
                } else {
                    skipOctave(randomSource);
                }
            } else {
                skipOctave(randomSource);
            }
        }
    }

    this->lowestFreqInputFactor = pow(2.0, (double)(-minusFirstOctave));
    this->lowestFreqValueFactor = pow(2.0, (double)(amplitudesCount - 1)) / (pow(2.0, (double)amplitudesCount) - 1.0);
}

void PerlinNoise::skipOctave(RandomSource *randomSource) {
    randomSource->consumeCount(262);
}

double PerlinNoise::getValue(double x, double y, double z) {
    return this->getValue(x, y, z, 0.0, 0.0, false);
}

double PerlinNoise::getValue(double x, double y, double z, double yStep, double maxYfract, bool useYfractOverride) {
    double value = 0.0;
    double inputScale = this->lowestFreqInputFactor;
    double outputScale = this->lowestFreqValueFactor;

    for (int32_t i = 0; i < this->noiseLevels->size(); ++i) {
        ImprovedNoise *improvednoise = this->noiseLevels->at(i);
        if (improvednoise != nullptr) {
            double d3 = improvednoise->noise(wrap(x * inputScale),
                                             useYfractOverride ? -improvednoise->yo : wrap(y * inputScale),
                                             wrap(z * inputScale), yStep * inputScale, maxYfract * inputScale);
            value += this->amplitudes->at(i) * d3 * outputScale;
        }

        inputScale *= 2.0;
        outputScale /= 2.0;
    }

    return value;
}

ImprovedNoise *PerlinNoise::getOctaveNoise(int32_t octave) {
    return this->noiseLevels->at(this->noiseLevels->size() - 1 - octave);
}