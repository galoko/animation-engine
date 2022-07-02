#pragma once

#include <utility>

#include "improved-noise.hpp"

using namespace std;

class PerlinNoise {
private:
    static const int ROUND_OFF = 33554432;
    vector<ImprovedNoise *> *noiseLevels;
    int firstOctave;
    vector<double> *amplitudes;
    double lowestFreqValueFactor;
    double lowestFreqInputFactor;

public:
    static PerlinNoise *createLegacyForBlendedNoise(RandomSource *p_192886_, vector<int> *p_192887_) {
        return new PerlinNoise(p_192886_, makeAmplitudes(p_192887_), false);
    }

    static PerlinNoise *createLegacyForLegacyNormalNoise(RandomSource *p_192879_, int p_192880_,
                                                         vector<double> *p_192881_) {
        return new PerlinNoise(p_192879_, new pair(p_192880_, p_192881_), false);
    }

    static PerlinNoise *create(RandomSource *p_192883_, vector<int> *p_192884_) {
        return new PerlinNoise(p_192883_, makeAmplitudes(p_192884_), true);
    }

    static PerlinNoise *create(RandomSource *p_164382_, int p_164383_, vector<double> *p_164384_) {
        return new PerlinNoise(p_164382_, new pair(p_164383_, p_164384_), true);
    }

private:
    static pair<int, vector<double> *> *makeAmplitudes(vector<int> *p_75431_) {
        int i = -p_75431_->front();
        int j = p_75431_->back();
        int k = i + j + 1;

        vector<double> *doublelist = new vector<double>(k, 0.0);

        for (int &l : *p_75431_) {
            doublelist->at(l + i) = 1.0;
        }

        return new pair(-i, doublelist);
    }

public:
    PerlinNoise(RandomSource *p_192869_, pair<int, vector<double> *> *p_192870_, bool p_192871_) {
        this->firstOctave = p_192870_->first;
        this->amplitudes = p_192870_->second;
        int i = this->amplitudes->size();
        int j = -this->firstOctave;
        this->noiseLevels = new vector<ImprovedNoise *>(i);
        if (p_192871_) {
            PositionalRandomFactory *positionalrandomfactory = p_192869_->forkPositional();

            for (int k = 0; k < i; ++k) {
                if (this->amplitudes->at(k) != 0.0) {
                    int l = this->firstOctave + k;
                    this->noiseLevels->at(k) =
                        new ImprovedNoise(positionalrandomfactory->fromHashOf("octave_" + to_string(l)));
                }
            }
        } else {
            ImprovedNoise *improvednoise = new ImprovedNoise(p_192869_);
            if (j >= 0 && j < i) {
                double d0 = this->amplitudes->at(j);
                if (d0 != 0.0) {
                    this->noiseLevels->at(j) = improvednoise;
                }
            }

            for (int i1 = j - 1; i1 >= 0; --i1) {
                if (i1 < i) {
                    double d1 = this->amplitudes->at(i1);
                    if (d1 != 0.0) {
                        this->noiseLevels->at(i1) = new ImprovedNoise(p_192869_);
                    } else {
                        skipOctave(p_192869_);
                    }
                } else {
                    skipOctave(p_192869_);
                }
            }
        }

        this->lowestFreqInputFactor = pow(2.0, (double)(-j));
        this->lowestFreqValueFactor = pow(2.0, (double)(i - 1)) / (pow(2.0, (double)i) - 1.0);
    }

private:
    static void skipOctave(RandomSource *p_164380_) {
        p_164380_->consumeCount(262);
    }

public:
    double getValue(double p_75409_, double p_75410_, double p_75411_) {
        return this->getValue(p_75409_, p_75410_, p_75411_, 0.0, 0.0, false);
    }

    double getValue(double p_75418_, double p_75419_, double p_75420_, double p_75421_, double p_75422_,
                    bool p_75423_) {
        double d0 = 0.0;
        double d1 = this->lowestFreqInputFactor;
        double d2 = this->lowestFreqValueFactor;

        for (int i = 0; i < this->noiseLevels->size(); ++i) {
            ImprovedNoise *improvednoise = this->noiseLevels->at(i);
            if (improvednoise != nullptr) {
                double d3 =
                    improvednoise->noise(wrap(p_75418_ * d1), p_75423_ ? -improvednoise->yo : wrap(p_75419_ * d1),
                                         wrap(p_75420_ * d1), p_75421_ * d1, p_75422_ * d1);
                d0 += this->amplitudes->at(i) * d3 * d2;
            }

            d1 *= 2.0;
            d2 /= 2.0;
        }

        return d0;
    }

    ImprovedNoise *getOctaveNoise(int p_75425_) {
        return this->noiseLevels->at(this->noiseLevels->size() - 1 - p_75425_);
    }

    static double wrap(double p_75407_) {
        return p_75407_ - (double)Mth::lfloor(p_75407_ / 3.3554432E7 + 0.5) * 3.3554432E7;
    }
};