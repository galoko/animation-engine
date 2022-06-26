#pragma once

#include <cmath>
#include <stdint.h>
#include <string>

#include "pos.hpp"

extern "C" {
#include "../../thirdparty/md5.h"
}

using namespace std;

#define ushr_l(value, bits) ((int64_t)((uint64_t)value >> bits))
#define toUnsignedLong(x) (((int64_t)x) & 0xffffffffL)
#define remainderUnsigned(dividend, divisor) ((int32_t)(toUnsignedLong(dividend) % toUnsignedLong(divisor)))

int64_t rotateLeft(int64_t n, int32_t d) {
    return (n << d) | (n >> (64 - d));
}

int64_t fromBytes(int8_t b1, int8_t b2, int8_t b3, int8_t b4, int8_t b5, int8_t b6, int8_t b7, int8_t b8) {
    return (int64_t)(b1 & 0xFFL) << 56 | (int64_t)(b2 & 0xFFL) << 48 | (int64_t)(b3 & 0xFFL) << 40 |
           (int64_t)(b4 & 0xFFL) << 32 | (int64_t)(b5 & 0xFFL) << 24 | (int64_t)(b6 & 0xFFL) << 16 |
           (int64_t)(b7 & 0xFFL) << 8 | (int64_t)(b8 & 0xFFL);
}

string toResourceLocation(string path) {
    string _namespace = "minecraft";
    return _namespace + ":" + path;
}

class ResourceLocation {
public:
    string toString() {
        return ""; // TODO
    }
};

class PositionalRandomFactory;

class RandomSource {
public:
    virtual RandomSource *fork() = 0;

    virtual PositionalRandomFactory *forkPositional() = 0;

    virtual void setSeed(int64_t seed) = 0;

    virtual int32_t nextInt() = 0;
    virtual int32_t nextInt(int32_t bound) = 0;

    virtual int32_t nextIntBetweenInclusive(int32_t min, int32_t max) {
        return this->nextInt(max - min + 1) + min;
    }

    virtual int64_t nextLong() = 0;

    virtual bool nextBoolean() = 0;

    virtual float nextFloat() = 0;

    virtual double nextDouble() = 0;

    virtual double nextGaussian() = 0;

    void consumeCount(int32_t count) {
        for (int32_t i = 0; i < count; ++i) {
            this->nextInt();
        }
    }
};

class PositionalRandomFactory {
public:
    RandomSource *at(BlockPos pos) {
        return this->at(pos.getX(), pos.getY(), pos.getZ());
    }

    RandomSource *fromHashOf(ResourceLocation *loc) {
        return this->fromHashOf(loc->toString());
    }

    virtual RandomSource *fromHashOf(string s) = 0;

    virtual RandomSource *at(int32_t x, int32_t y, int32_t z) = 0;
};

class RandomSupport final {
public:
    class Seed128bit {
    public:
        int64_t seedLo, seedHi;
        Seed128bit(int64_t seedLo, int64_t seedHi) : seedLo(seedLo), seedHi(seedHi) {
        }
    };

    static const int64_t GOLDEN_RATIO_64 = -7046029254386353131L;
    static const int64_t SILVER_RATIO_64 = 7640891576956012809L;

    static int64_t mixStafford13(int64_t seed) {
        seed = (seed ^ ushr_l(seed, 30)) * -4658895280553007687L;
        seed = (seed ^ ushr_l(seed, 27)) * -7723592293110705685L;
        return seed ^ ushr_l(seed, 31);
    }

    static RandomSupport::Seed128bit *upgradeSeedTo128bit(int64_t seed) {
        int64_t lo = seed ^ SILVER_RATIO_64;
        int64_t hi = lo + GOLDEN_RATIO_64;
        return new RandomSupport::Seed128bit(mixStafford13(lo), mixStafford13(hi));
    }
};

// implementations

class Xoroshiro128PlusPlus {
private:
    int64_t seedLo, seedHi;

public:
    Xoroshiro128PlusPlus(RandomSupport::Seed128bit *seed) : Xoroshiro128PlusPlus(seed->seedLo, seed->seedHi) {
    }

    Xoroshiro128PlusPlus(int64_t seedLo, int64_t seedHi) {
        this->seedLo = seedLo;
        this->seedHi = seedHi;
        if ((this->seedLo | this->seedHi) == 0L) {
            this->seedLo = -7046029254386353131L;
            this->seedHi = 7640891576956012809L;
        }
    }

    int64_t nextLong() {
        int64_t seedLo = this->seedLo;
        int64_t seedHi = this->seedHi;
        int64_t rotatedSeed = rotateLeft(seedLo + seedHi, 17) + seedLo;
        seedHi ^= seedLo;
        this->seedLo = rotateLeft(seedLo, 49) ^ seedHi ^ seedHi << 21;
        this->seedHi = rotateLeft(seedHi, 28);
        return rotatedSeed;
    }
};

class MarsagliaPolarGaussian {
public:
    RandomSource *randomSource;

private:
    double nextNextGaussian;
    bool haveNextNextGaussian;

public:
    MarsagliaPolarGaussian(RandomSource *randomSource) {
        this->randomSource = randomSource;
    }

    void reset() {
        this->haveNextNextGaussian = false;
    }

    double nextGaussian() {
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
};

// source implementations

class XoroshiroRandomSource : public RandomSource {
private:
    static constexpr float FLOAT_UNIT = 5.9604645E-8F;
    static constexpr double DOUBLE_UNIT = (double)1.110223E-16F;
    Xoroshiro128PlusPlus *randomNumberGenerator;
    MarsagliaPolarGaussian *gaussianSource = new MarsagliaPolarGaussian(this);

public:
    XoroshiroRandomSource(int64_t seed) {
        this->randomNumberGenerator = new Xoroshiro128PlusPlus(RandomSupport::upgradeSeedTo128bit(seed));
    }

    XoroshiroRandomSource(int64_t seedLo, int64_t seedHi) {
        this->randomNumberGenerator = new Xoroshiro128PlusPlus(seedLo, seedHi);
    }

    RandomSource *fork() {
        return new XoroshiroRandomSource(this->randomNumberGenerator->nextLong(),
                                         this->randomNumberGenerator->nextLong());
    }

    PositionalRandomFactory *forkPositional() {
        return new XoroshiroRandomSource::XoroshiroPositionalRandomFactory(this->randomNumberGenerator->nextLong(),
                                                                           this->randomNumberGenerator->nextLong());
    }

    void setSeed(int64_t seed) {
        this->randomNumberGenerator = new Xoroshiro128PlusPlus(RandomSupport::upgradeSeedTo128bit(seed));
        this->gaussianSource->reset();
    }

    int32_t nextInt() {
        return (int32_t)this->randomNumberGenerator->nextLong();
    }

    int32_t nextInt(int32_t bound) {

        int64_t i = toUnsignedLong(this->nextInt());
        int64_t j = i * (int64_t)bound;
        int64_t k = j & 4294967295L;
        if (k < (int64_t)bound) {
            for (int32_t l = remainderUnsigned(~bound + 1, bound); k < (int64_t)l; k = j & 4294967295L) {
                i = toUnsignedLong(this->nextInt());
                j = i * (int64_t)bound;
            }
        }

        int64_t i1 = j >> 32;
        return (int32_t)i1;
    }

    int64_t nextLong() {
        return this->randomNumberGenerator->nextLong();
    }

    bool nextBoolean() {
        return (this->randomNumberGenerator->nextLong() & 1L) != 0L;
    }

    float nextFloat() {
        return (float)this->nextBits(24) * 5.9604645E-8F;
    }

    double nextDouble() {
        return (double)this->nextBits(53) * (double)1.110223E-16F;
    }

    double nextGaussian() {
        return this->gaussianSource->nextGaussian();
    }

    void consumeCount(int32_t count) {
        for (int32_t i = 0; i < count; ++i) {
            this->randomNumberGenerator->nextLong();
        }
    }

private:
    int64_t nextBits(int32_t bits) {
        return ushr_l(this->randomNumberGenerator->nextLong(), (64 - bits));
    }

public:
    class XoroshiroPositionalRandomFactory : public PositionalRandomFactory {
    private:
        int64_t seedLo, seedHi;

    public:
        XoroshiroPositionalRandomFactory(int64_t seedLo, int64_t seedHi) : seedLo(seedLo), seedHi(seedHi) {
        }

        RandomSource *at(int32_t x, int32_t y, int32_t z) {
            int64_t i = Mth::getSeed(x, y, z);
            int64_t j = i ^ this->seedLo;
            return new XoroshiroRandomSource(j, this->seedHi);
        }

        RandomSource *fromHashOf(string s) {
            MD5_CTX md5;
            md5_init(&md5);
            md5_update(&md5, (const BYTE *)s.c_str(), s.length() * sizeof(char));
            BYTE hash[MD5_BLOCK_SIZE];
            md5_final(&md5, hash);

            int64_t lo = Mth::fromBytes(hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7]);
            int64_t hi = Mth::fromBytes(hash[8], hash[9], hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]);
            return new XoroshiroRandomSource(lo ^ this->seedLo, hi ^ this->seedHi);
        }
    };
};