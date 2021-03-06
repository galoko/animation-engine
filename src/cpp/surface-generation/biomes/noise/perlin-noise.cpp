#include "perlin-noise.hpp"

// PerlinNoise

PerlinNoise PerlinNoise::createLegacyForBlendedNoise(shared_ptr<RandomSource> randomSource,
                                                     vector<int32_t> const &octaves) {
    return PerlinNoise(randomSource, makeAmplitudes(octaves), false);
}

PerlinNoise PerlinNoise::createLegacyForLegacyNormalNoise(shared_ptr<RandomSource> randomSource, int32_t firstOctave,
                                                          vector<double> const &amplitudes) {
    return PerlinNoise(randomSource, pair(firstOctave, amplitudes), false);
}

PerlinNoise PerlinNoise::create(shared_ptr<RandomSource> randomSource, vector<int32_t> const &octaves) {
    return PerlinNoise(randomSource, makeAmplitudes(octaves), true);
}

PerlinNoise PerlinNoise::create(shared_ptr<RandomSource> randomSource, int32_t firstOctave,
                                vector<double> const &amplitudes) {
    return PerlinNoise(randomSource, pair(firstOctave, amplitudes), true);
}

pair<int32_t, vector<double>> PerlinNoise::makeAmplitudes(vector<int32_t> const &octaves) {
    int32_t minusFirstOctave = -octaves.front();
    int32_t lastOctave = octaves.back();
    int32_t octaveLength = minusFirstOctave + lastOctave + 1;

    vector<double> amplitudes = vector<double>(octaveLength, 0.0);

    for (int32_t const &l : octaves) {
        amplitudes.at(l + minusFirstOctave) = 1.0;
    }

    return pair(-minusFirstOctave, amplitudes);
}

PerlinNoise::PerlinNoise(shared_ptr<RandomSource> randomSource,
                         pair<int32_t, vector<double>> const &octaveAndAmplitudes, bool notLegacy) {
    this->firstOctave = octaveAndAmplitudes.first;
    this->amplitudes = octaveAndAmplitudes.second;
    int32_t amplitudesCount = this->amplitudes.size();
    int32_t minusFirstOctave = -this->firstOctave;
    this->noiseLevels = vector<shared_ptr<ImprovedNoise>>(amplitudesCount);
    if (notLegacy) {
        unique_ptr<PositionalRandomFactory> positionalrandomfactory = randomSource->forkPositional();

        for (int32_t amplitudeIndex = 0; amplitudeIndex < amplitudesCount; ++amplitudeIndex) {
            if (this->amplitudes.at(amplitudeIndex) != 0.0) {
                int32_t octave = this->firstOctave + amplitudeIndex;
                this->noiseLevels.at(amplitudeIndex) =
                    make_shared<ImprovedNoise>(positionalrandomfactory->fromHashOf("octave_" + to_string(octave)));
            }
        }
    } else {
        shared_ptr<ImprovedNoise> improvednoise = make_shared<ImprovedNoise>(randomSource);
        if (minusFirstOctave >= 0 && minusFirstOctave < amplitudesCount) {
            double amplitude = this->amplitudes.at(minusFirstOctave);
            if (amplitude != 0.0) {
                this->noiseLevels.at(minusFirstOctave) = improvednoise;
            }
        }

        for (int32_t octaveIndex = minusFirstOctave - 1; octaveIndex >= 0; --octaveIndex) {
            if (octaveIndex < amplitudesCount) {
                double d1 = this->amplitudes.at(octaveIndex);
                if (d1 != 0.0) {
                    this->noiseLevels.at(octaveIndex) = make_shared<ImprovedNoise>(randomSource);
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

void PerlinNoise::skipOctave(shared_ptr<RandomSource> randomSource) {
    randomSource->consumeCount(262);
}

double PerlinNoise::getValue(double x, double y, double z) const {
    return this->getValue(x, y, z, 0.0, 0.0, false);
}

double PerlinNoise::getValue(double x, double y, double z, double yStep, double maxYfract,
                             bool useYfractOverride) const {
    double value = 0.0;
    double inputScale = this->lowestFreqInputFactor;
    double outputScale = this->lowestFreqValueFactor;

    for (int32_t i = 0; i < this->noiseLevels.size(); ++i) {
        shared_ptr<ImprovedNoise> improvednoise = this->noiseLevels.at(i);
        if (improvednoise != nullptr) {
            double d3 = improvednoise->noise(wrap(x * inputScale),
                                             useYfractOverride ? -improvednoise->yo : wrap(y * inputScale),
                                             wrap(z * inputScale), yStep * inputScale, maxYfract * inputScale);
            value += this->amplitudes.at(i) * d3 * outputScale;
        }

        inputScale *= 2.0;
        outputScale /= 2.0;
    }

    return value;
}

shared_ptr<ImprovedNoise> PerlinNoise::getOctaveNoise(int32_t octave) const {
    return this->noiseLevels.at(this->noiseLevels.size() - 1 - octave);
}