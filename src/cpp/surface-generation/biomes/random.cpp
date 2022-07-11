#include "random.hpp"

// Utils

int32_t hashCode(string s) {
    int32_t h = 0;
    for (int32_t i = 0; i < s.length(); i++) {
        h = (31 * h) + s[i];
    }
    return h;
}

string toResourceLocation(string path) {
    string _namespace = "minecraft";
    return _namespace + ":" + path;
}

// RandomSource

int32_t RandomSource::nextIntBetweenInclusive(int32_t min, int32_t max) {
    return this->nextInt(max - min + 1) + min;
}

void RandomSource::consumeCount(int32_t count) {
    for (int32_t i = 0; i < count; ++i) {
        this->nextInt();
    }
}

// PositionalRandomFactory

RandomSource *PositionalRandomFactory::at(BlockPos *pos) {
    return this->at(pos->getX(), pos->getY(), pos->getZ());
}

RandomSource *PositionalRandomFactory::fromHashOfResourceLocation(string loc) {
    return this->fromHashOf(toResourceLocation(loc));
}

// MarsagliaPolarGaussian

MarsagliaPolarGaussian::MarsagliaPolarGaussian(RandomSource *randomSource) : randomSource(randomSource) {
}

void MarsagliaPolarGaussian::reset() {
    this->haveNextNextGaussian = false;
}

double MarsagliaPolarGaussian::nextGaussian() {
    if (this->haveNextNextGaussian) {
        this->haveNextNextGaussian = false;
        return this->nextNextGaussian;
    } else {
        while (true) {
            double d0 = 2.0 * this->randomSource->nextDouble() - 1.0;
            double d1 = 2.0 * this->randomSource->nextDouble() - 1.0;
            double d2 = Mth::square(d0) + Mth::square(d1);
            if (!(d2 >= 1.0)) {
                if (d2 != 0.0) {
                    double d3 = sqrt(-2.0 * log(d2) / d2);
                    this->nextNextGaussian = d1 * d3;
                    this->haveNextNextGaussian = true;
                    return d0 * d3;
                }
            }
        }
    }
}

// Xoroshiro128PlusPlus

Xoroshiro128PlusPlus::Xoroshiro128PlusPlus(RandomSupport::Seed128bit seed)
    : Xoroshiro128PlusPlus(seed.seedLo, seed.seedHi) {
}

Xoroshiro128PlusPlus::Xoroshiro128PlusPlus(int64_t seedLo, int64_t seedHi) {
    this->seedLo = seedLo;
    this->seedHi = seedHi;
    if ((this->seedLo | this->seedHi) == 0LL) {
        this->seedLo = -7046029254386353131LL;
        this->seedHi = 7640891576956012809LL;
    }
}

int64_t Xoroshiro128PlusPlus::nextLong() {
    int64_t seedLo = this->seedLo;
    int64_t seedHi = this->seedHi;
    int64_t rotatedSeed = rotateLeft(seedLo + seedHi, 17) + seedLo;
    seedHi ^= seedLo;
    this->seedLo = rotateLeft(seedLo, 49) ^ seedHi ^ (seedHi << 21);
    this->seedHi = rotateLeft(seedHi, 28);
    return rotatedSeed;
}

// XoroshiroRandomSource
