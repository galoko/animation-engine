#pragma once

#include <cmath>
#include <stdint.h>
#include <string>

#include "mth.hpp"
#include "pos.hpp"

extern "C" {
#include "../../thirdparty/md5.h"
}

using namespace std;

#define toUnsignedLong(x) (((int64_t)x) & 0xffffffffLL)
#define remainderUnsigned(dividend, divisor) ((int32_t)(toUnsignedLong(dividend) % toUnsignedLong(divisor)))

int64_t rotateLeft(int64_t n, int32_t d) {
    return (n << d) | ((uint64_t)n >> (64 - d));
}

int64_t fromBytes(int8_t b1, int8_t b2, int8_t b3, int8_t b4, int8_t b5, int8_t b6, int8_t b7, int8_t b8) {
    return (b1 & 0xFFLL) << 56 | (b2 & 0xFFLL) << 48 | (b3 & 0xFFLL) << 40 | (b4 & 0xFFLL) << 32 | (b5 & 0xFFLL) << 24 |
           (b6 & 0xFFLL) << 16 | (b7 & 0xFFLL) << 8 | (b8 & 0xFFLL);
}

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

    virtual void consumeCount(int32_t count) {
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

    RandomSource *fromHashOfResourceLocation(string loc) {
        return this->fromHashOf(toResourceLocation(loc));
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

    static const int64_t GOLDEN_RATIO_64 = -7046029254386353131LL;
    static const int64_t SILVER_RATIO_64 = 7640891576956012809LL;

    static int64_t mixStafford13(int64_t seed) {
        seed = (seed ^ ushr_l(seed, 30)) * -4658895280553007687LL;
        seed = (seed ^ ushr_l(seed, 27)) * -7723592293110705685LL;
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
        if ((this->seedLo | this->seedHi) == 0LL) {
            this->seedLo = -7046029254386353131LL;
            this->seedHi = 7640891576956012809LL;
        }
    }

    int64_t nextLong() {
        int64_t seedLo = this->seedLo;
        int64_t seedHi = this->seedHi;
        int64_t rotatedSeed = rotateLeft(seedLo + seedHi, 17) + seedLo;
        seedHi ^= seedLo;
        this->seedLo = rotateLeft(seedLo, 49) ^ seedHi ^ (seedHi << 21);
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
        int64_t k = j & 4294967295LL;
        if (k < (int64_t)bound) {
            for (int32_t l = remainderUnsigned(~bound + 1, bound); k < (int64_t)l; k = j & 4294967295LL) {
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
        return (this->randomNumberGenerator->nextLong() & 1LL) != 0LL;
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
            BYTE hash[MD5_BLOCK_SIZE];

            md5_init(&md5);
            md5_update(&md5, (const BYTE *)s.c_str(), s.length() * sizeof(char));
            md5_final(&md5, hash);

            int64_t lo = fromBytes(hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7]);
            int64_t hi = fromBytes(hash[8], hash[9], hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]);
            return new XoroshiroRandomSource(lo ^ this->seedLo, hi ^ this->seedHi);
        }
    };
};

class BitRandomSource : public RandomSource {
public:
    static constexpr float FLOAT_MULTIPLIER = 5.9604645E-8F;
    static constexpr double DOUBLE_MULTIPLIER = (double)1.110223E-16F;

    virtual int32_t next(int32_t bits) = 0;

    int32_t nextInt() {
        return this->next(32);
    }

    int32_t nextInt(int32_t bound) {
        if ((bound & bound - 1) == 0) {
            return (int32_t)((int64_t)bound * (int64_t)this->next(31) >> 31);
        } else {
            int32_t i;
            int32_t j;
            do {
                i = this->next(31);
                j = i % bound;
            } while (i - j + (bound - 1) < 0);

            return j;
        }
    }

    int64_t nextLong() {
        int32_t i = this->next(32);
        int32_t j = this->next(32);
        int64_t k = (int64_t)i << 32;
        return k + (int64_t)j;
    }

    bool nextBoolean() {
        return this->next(1) != 0;
    }

    float nextFloat() {
        return (float)this->next(24) * FLOAT_MULTIPLIER;
    }

    double nextDouble() {
        int32_t i = this->next(26);
        int32_t j = this->next(27);
        int64_t k = ((int64_t)i << 27) + (int64_t)j;
        return (double)k * DOUBLE_MULTIPLIER;
    }
};
class LegacyRandomSource : public BitRandomSource {
private:
    static constexpr int32_t MODULUS_BITS = 48;
    static constexpr int64_t MODULUS_MASK = 281474976710655LL;
    static constexpr int64_t MULTIPLIER = 25214903917LL;
    static constexpr int64_t INCREMENT = 11LL;
    int64_t seed;
    MarsagliaPolarGaussian *gaussianSource = new MarsagliaPolarGaussian(this);

public:
    LegacyRandomSource(int64_t seed) {
        this->setSeed(seed);
    }

    RandomSource *fork() {
        return new LegacyRandomSource(this->nextLong());
    }

    PositionalRandomFactory *forkPositional() {
        return new LegacyRandomSource::LegacyPositionalRandomFactory(this->nextLong());
    }

    void setSeed(int64_t seed) {
        this->seed = (seed ^ MULTIPLIER) & MODULUS_MASK;
        this->gaussianSource->reset();
    }

    int32_t next(int32_t bits) {
        int64_t seed = this->seed;
        int64_t newSeed = seed * MULTIPLIER + INCREMENT & MODULUS_MASK;
        this->seed = newSeed;

        return (int32_t)(newSeed >> (MODULUS_BITS - bits));
    }

    double nextGaussian() {
        return this->gaussianSource->nextGaussian();
    }

    class LegacyPositionalRandomFactory : public PositionalRandomFactory {
    private:
        int64_t seed;

    public:
        LegacyPositionalRandomFactory(int64_t seed) {
            this->seed = seed;
        }

        RandomSource *at(int32_t x, int32_t y, int32_t z) {
            int64_t seed = Mth::getSeed(x, y, z);
            int64_t newSeed = seed ^ this->seed;
            return new LegacyRandomSource(newSeed);
        }

        RandomSource *fromHashOf(string s) {
            int32_t hash = hashCode(s);
            return new LegacyRandomSource((int64_t)hash ^ this->seed);
        }
    };
};

class Random : public RandomSource {
private:
    int64_t seed;

    static const int64_t multiplier = 0x5DEECE66DLL;
    static const int64_t addend = 0xBLL;
    static const int64_t mask = (1LL << 48) - 1;

    static constexpr double DOUBLE_UNIT = 0x1.0p-53; // 1.0 / (1LL << 53)

public:
    Random(int64_t seed) {
        this->setSeed(seed);
    }

    RandomSource *fork() {
        return nullptr;
    }

    PositionalRandomFactory *forkPositional() {
        return nullptr;
    }

private:
    static int64_t initialScramble(int64_t seed) {
        return (seed ^ multiplier) & mask;
    }

public:
    virtual void setSeed(int64_t seed) {
        this->seed = initialScramble(seed);
        this->haveNextNextGaussian = false;
    }

protected:
    virtual int32_t next(int32_t bits) {
        this->seed = (this->seed * multiplier + addend) & mask;
        return (int32_t)(ushr_l(this->seed, (48 - bits)));
    }

public:
    int32_t nextInt() {
        return next(32);
    }

    int32_t nextInt(int32_t bound) {
        int32_t r = next(31);
        int32_t m = bound - 1;
        if ((bound & m) == 0) // i.e., bound is a power of 2
            r = (int32_t)((bound * (int64_t)r) >> 31);
        else { // reject over-represented candidates
            for (int32_t u = r; u - (r = u % bound) + m < 0; u = next(31))
                ;
        }
        return r;
    }

    int64_t nextLong() {
        // it's okay that the bottom word remains signed.
        return ((int64_t)(next(32)) << 32) + next(32);
    }

    bool nextBoolean() {
        return next(1) != 0;
    }

    float nextFloat() {
        return next(24) / ((float)(1 << 24));
    }

    double nextDouble() {
        return (((int64_t)(next(26)) << 27) + next(27)) * DOUBLE_UNIT;
    }

private:
    double nextNextGaussian;
    bool haveNextNextGaussian = false;

    double nextGaussian() {
        // See Knuth, TAOCP, Vol. 2, 3rd edition, Section 3.4.1 Algorithm C.
        if (haveNextNextGaussian) {
            haveNextNextGaussian = false;
            return nextNextGaussian;
        } else {
            double v1, v2, s;
            do {
                v1 = 2 * nextDouble() - 1; // between -1 and 1
                v2 = 2 * nextDouble() - 1; // between -1 and 1
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            double multiplier = sqrt(-2 * log(s) / s);
            nextNextGaussian = v2 * multiplier;
            haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    }
};

class WorldgenRandom : public Random {
private:
    RandomSource *randomSource;
    int32_t count;

public:
    WorldgenRandom(RandomSource *randomSource) : Random(0LL), randomSource(randomSource) {
    }

    int32_t getCount() {
        return this->count;
    }

    RandomSource *fork() {
        return this->randomSource->fork();
    }

    PositionalRandomFactory *forkPositional() {
        return this->randomSource->forkPositional();
    }

    int32_t next(int32_t bits) {
        ++this->count;
        RandomSource *randomsource = this->randomSource;
        if (LegacyRandomSource *legacyrandomsource = dynamic_cast<LegacyRandomSource *>(randomsource)) {
            return legacyrandomsource->next(bits);
        } else {
            return (int32_t)(ushr_l(this->randomSource->nextLong(), (64 - bits)));
        }
    }

    void setSeed(int64_t seed) {
        if (this->randomSource != nullptr) {
            this->randomSource->setSeed(seed);
        }
    }

    int64_t setDecorationSeed(int64_t seed, int32_t x, int32_t y) {
        this->setSeed(seed);
        int64_t i = this->nextLong() | 1LL;
        int64_t j = this->nextLong() | 1LL;
        int64_t newSeed = (int64_t)x * i + (int64_t)y * j ^ seed;
        this->setSeed(newSeed);
        return newSeed;
    }

    void setFeatureSeed(int64_t seed, int32_t counter1, int32_t counter2) {
        int64_t newSeed = seed + (int64_t)counter1 + (int64_t)(10000 * counter2);
        this->setSeed(newSeed);
    }

    void setLargeFeatureSeed(int64_t seed, int32_t x, int32_t y) {
        this->setSeed(seed);
        int64_t i = this->nextLong();
        int64_t j = this->nextLong();
        int64_t newSeed = (int64_t)x * i ^ (int64_t)y * j ^ seed;
        this->setSeed(newSeed);
    }

    void setLargeFeatureWithSalt(int64_t salt, int32_t x, int32_t y, int32_t z) {
        int64_t seed = (int64_t)x * 341873128712LL + (int64_t)y * 132897987541LL + salt + (int64_t)z;
        this->setSeed(seed);
    }

    static Random *seedSlimeChunk(int32_t x, int32_t z, int64_t seed, int64_t salt) {
        return new Random(seed + (int64_t)(x * x * 4987142) + (int64_t)(x * 5947611) + (int64_t)(z * z) * 4392871LL +
                              (int64_t)(z * 389711) ^
                          salt);
    }

    enum class Algorithm
    {
        LEGACY,
        XOROSHIRO,
    };

    static RandomSource *Algorithm_newInstance(Algorithm algorithm, int64_t seed) {
        if (algorithm == Algorithm::LEGACY) {
            return new LegacyRandomSource(seed);
        } else if (algorithm == Algorithm::XOROSHIRO) {
            return new XoroshiroRandomSource(seed);
        } else {
            return nullptr;
        }
    }
};

class LinearCongruentialGenerator {
private:
    static const int64_t MULTIPLIER = 6364136223846793005LL;
    static const int64_t INCREMENT = 1442695040888963407LL;

public:
    static int64_t next(int64_t seed, int64_t n) {
        seed *= seed * MULTIPLIER + INCREMENT;
        return seed + n;
    }
};