#pragma once

#include <cmath>
#include <cstdint>
#include <memory>
#include <string>

#include "memory-debug.hpp"
#include "mth.hpp"
#include "pos.hpp"

extern "C" {
#include "../../thirdparty/md5.h"
}

using namespace std;

#define toUnsignedLong(x) (((int64_t)x) & 0xffffffffLL)
#define remainderUnsigned(dividend, divisor) ((int32_t)(toUnsignedLong(dividend) % toUnsignedLong(divisor)))

constexpr inline int64_t rotateLeft(int64_t n, int32_t d) {
    return (n << d) | ((uint64_t)n >> (64 - d));
}

constexpr inline int64_t fromBytes(int8_t b1, int8_t b2, int8_t b3, int8_t b4, int8_t b5, int8_t b6, int8_t b7,
                                   int8_t b8) {
    return (b1 & 0xFFLL) << 56 | (b2 & 0xFFLL) << 48 | (b3 & 0xFFLL) << 40 | (b4 & 0xFFLL) << 32 | (b5 & 0xFFLL) << 24 |
           (b6 & 0xFFLL) << 16 | (b7 & 0xFFLL) << 8 | (b8 & 0xFFLL);
}

// TODO move to utils?
int32_t hashCode(string s);
string toResourceLocation(string path);

class PositionalRandomFactory;

class RandomSource {
public:
    virtual unique_ptr<RandomSource> fork() = 0;
    virtual unique_ptr<PositionalRandomFactory> forkPositional() = 0;

    virtual void setSeed(int64_t seed) = 0;

    virtual int32_t nextInt() = 0;
    virtual int32_t nextInt(int32_t bound) = 0;
    virtual int64_t nextLong() = 0;
    virtual bool nextBoolean() = 0;
    virtual float nextFloat() = 0;
    virtual double nextDouble() = 0;
    virtual double nextGaussian() = 0;

    virtual int32_t nextIntBetweenInclusive(int32_t min, int32_t max);
    virtual void consumeCount(int32_t count);

    virtual ~RandomSource() {
        objectFreed("RandomSource");
    }
};

class PositionalRandomFactory {
public:
    virtual unique_ptr<RandomSource> fromHashOf(string s) = 0;
    unique_ptr<RandomSource> fromHashOfResourceLocation(string loc);

    virtual unique_ptr<RandomSource> at(int32_t x, int32_t y, int32_t z) = 0;
    unique_ptr<RandomSource> at(BlockPos const &pos);

    virtual ~PositionalRandomFactory() {
        objectFreed("PositionalRandomFactory");
    }
};

class RandomSupport {
public:
    class Seed128bit {
    public:
        int64_t seedLo, seedHi;
        Seed128bit(int64_t seedLo, int64_t seedHi) : seedLo(seedLo), seedHi(seedHi) {
        }
    };

    static const int64_t GOLDEN_RATIO_64 = -7046029254386353131LL;
    static const int64_t SILVER_RATIO_64 = 7640891576956012809LL;

    static constexpr inline int64_t mixStafford13(int64_t seed) {
        seed = (seed ^ ushr_l(seed, 30)) * -4658895280553007687LL;
        seed = (seed ^ ushr_l(seed, 27)) * -7723592293110705685LL;
        return seed ^ ushr_l(seed, 31);
    }

    static inline RandomSupport::Seed128bit upgradeSeedTo128bit(int64_t seed) {
        int64_t lo = seed ^ SILVER_RATIO_64;
        int64_t hi = lo + GOLDEN_RATIO_64;
        return RandomSupport::Seed128bit(mixStafford13(lo), mixStafford13(hi));
    }
};

// implementations

class MarsagliaPolarGaussian {
public:
    RandomSource &randomSource;

private:
    double nextNextGaussian;
    bool haveNextNextGaussian;

public:
    MarsagliaPolarGaussian(RandomSource &randomSource);
    void reset();
    double nextGaussian();
};

class Xoroshiro128PlusPlus {
private:
    int64_t seedLo, seedHi;

public:
    Xoroshiro128PlusPlus(RandomSupport::Seed128bit const &seed);
    Xoroshiro128PlusPlus(int64_t seedLo, int64_t seedHi);

    int64_t nextLong();
};

// source implementations

class XoroshiroRandomSource : public RandomSource {
private:
    static constexpr float FLOAT_UNIT = 5.9604645E-8F;
    static constexpr double DOUBLE_UNIT = (double)1.110223E-16F;

    Xoroshiro128PlusPlus randomNumberGenerator;
    MarsagliaPolarGaussian gaussianSource = MarsagliaPolarGaussian(*this);

public:
    XoroshiroRandomSource(int64_t seed);
    XoroshiroRandomSource(int64_t seedLo, int64_t seedHi);

    unique_ptr<RandomSource> fork();
    unique_ptr<PositionalRandomFactory> forkPositional();

    void setSeed(int64_t seed);

    int32_t nextInt();
    int32_t nextInt(int32_t bound);
    int64_t nextLong();
    bool nextBoolean();
    float nextFloat();
    double nextDouble();
    double nextGaussian();
    void consumeCount(int32_t count);

private:
    int64_t nextBits(int32_t bits);

public:
    class XoroshiroPositionalRandomFactory : public PositionalRandomFactory {
    private:
        int64_t seedLo, seedHi;

    public:
        XoroshiroPositionalRandomFactory(int64_t seedLo, int64_t seedHi);

        unique_ptr<RandomSource> at(int32_t x, int32_t y, int32_t z);
        unique_ptr<RandomSource> fromHashOf(string s);
    };
};

class BitRandomSource : public RandomSource {
public:
    static constexpr float FLOAT_MULTIPLIER = 5.9604645E-8F;
    static constexpr double DOUBLE_MULTIPLIER = (double)1.110223E-16F;

    virtual int32_t next(int32_t bits) = 0;
    int32_t nextInt();
    int32_t nextInt(int32_t bound);
    int64_t nextLong();
    bool nextBoolean();
    float nextFloat();
    double nextDouble();
};

class LegacyRandomSource : public BitRandomSource {
private:
    static constexpr int32_t MODULUS_BITS = 48;
    static constexpr int64_t MODULUS_MASK = 281474976710655LL;
    static constexpr int64_t MULTIPLIER = 25214903917LL;
    static constexpr int64_t INCREMENT = 11LL;

    int64_t seed;
    MarsagliaPolarGaussian gaussianSource = MarsagliaPolarGaussian(*this);

public:
    LegacyRandomSource(int64_t seed);

    unique_ptr<RandomSource> fork();
    unique_ptr<PositionalRandomFactory> forkPositional();

    void setSeed(int64_t seed);

    int32_t next(int32_t bits);
    double nextGaussian();

    class LegacyPositionalRandomFactory : public PositionalRandomFactory {
    private:
        int64_t seed;

    public:
        LegacyPositionalRandomFactory(int64_t seed);

        unique_ptr<RandomSource> at(int32_t x, int32_t y, int32_t z);
        unique_ptr<RandomSource> fromHashOf(string s);
    };
};

class Random : public RandomSource {
private:
    int64_t seed;

    double nextNextGaussian;
    bool haveNextNextGaussian = false;

    static const int64_t multiplier = 0x5DEECE66DLL;
    static const int64_t addend = 0xBLL;
    static const int64_t mask = (1LL << 48) - 1;

    static constexpr double DOUBLE_UNIT = 0x1.0p-53; // 1.0 / (1LL << 53)

public:
    Random(int64_t seed);

    unique_ptr<RandomSource> fork();
    unique_ptr<PositionalRandomFactory> forkPositional();

    virtual void setSeed(int64_t seed);

private:
    static constexpr inline int64_t initialScramble(int64_t seed) {
        return (seed ^ multiplier) & mask;
    }

protected:
    virtual int32_t next(int32_t bits);

public:
    int32_t nextInt();
    int32_t nextInt(int32_t bound);
    int64_t nextLong();
    bool nextBoolean();
    float nextFloat();
    double nextDouble();

private:
    double nextGaussian();
};

class LinearCongruentialGenerator {
private:
    static const int64_t MULTIPLIER = 6364136223846793005LL;
    static const int64_t INCREMENT = 1442695040888963407LL;

public:
    static constexpr inline int64_t next(int64_t seed, int64_t n) {
        seed *= seed * MULTIPLIER + INCREMENT;
        return seed + n;
    }
};

class WorldgenRandom : public Random {
private:
    unique_ptr<RandomSource> randomSource;
    int32_t count;

public:
    WorldgenRandom(unique_ptr<RandomSource> randomSource);

    unique_ptr<RandomSource> fork();
    unique_ptr<PositionalRandomFactory> forkPositional();

    void setSeed(int64_t seed);

    int32_t getCount();

    int32_t next(int32_t bits);

    int64_t setDecorationSeed(int64_t seed, int32_t x, int32_t y);
    void setFeatureSeed(int64_t seed, int32_t counter1, int32_t counter2);
    void setLargeFeatureSeed(int64_t seed, int32_t x, int32_t y);
    void setLargeFeatureWithSalt(int64_t salt, int32_t x, int32_t y, int32_t z);
    static unique_ptr<Random> seedSlimeChunk(int32_t x, int32_t z, int64_t seed, int64_t salt);

    enum class Algorithm
    {
        LEGACY,
        XOROSHIRO,
    };

    static unique_ptr<RandomSource> Algorithm_newInstance(Algorithm algorithm, int64_t seed);
};