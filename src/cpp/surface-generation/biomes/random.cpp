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

unique_ptr<RandomSource> PositionalRandomFactory::at(BlockPos const &pos) {
    return this->at(pos.getX(), pos.getY(), pos.getZ());
}

unique_ptr<RandomSource> PositionalRandomFactory::fromHashOfResourceLocation(string loc) {
    return this->fromHashOf(toResourceLocation(loc));
}

// MarsagliaPolarGaussian

MarsagliaPolarGaussian::MarsagliaPolarGaussian(RandomSource &randomSource) : randomSource(randomSource) {
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
            double d0 = 2.0 * this->randomSource.nextDouble() - 1.0;
            double d1 = 2.0 * this->randomSource.nextDouble() - 1.0;
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

Xoroshiro128PlusPlus::Xoroshiro128PlusPlus(RandomSupport::Seed128bit const &seed)
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

XoroshiroRandomSource::XoroshiroRandomSource(int64_t seed)
    : randomNumberGenerator(RandomSupport::upgradeSeedTo128bit(seed)) {
    objectCreated("RandomSource");
}

XoroshiroRandomSource::XoroshiroRandomSource(int64_t seedLo, int64_t seedHi)
    : randomNumberGenerator(Xoroshiro128PlusPlus(seedLo, seedHi)) {
    objectCreated("RandomSource");
}

unique_ptr<RandomSource> XoroshiroRandomSource::fork() {
    int64_t seedLo = this->randomNumberGenerator.nextLong();
    int64_t seedHi = this->randomNumberGenerator.nextLong();
    return make_unique<XoroshiroRandomSource>(seedLo, seedHi);
}

unique_ptr<PositionalRandomFactory> XoroshiroRandomSource::forkPositional() {
    int64_t seedLo = this->randomNumberGenerator.nextLong();
    int64_t seedHi = this->randomNumberGenerator.nextLong();
    return make_unique<XoroshiroRandomSource::XoroshiroPositionalRandomFactory>(seedLo, seedHi);
}

void XoroshiroRandomSource::setSeed(int64_t seed) {
    this->randomNumberGenerator = Xoroshiro128PlusPlus(RandomSupport::upgradeSeedTo128bit(seed));
    this->gaussianSource.reset();
}

int32_t XoroshiroRandomSource::nextInt() {
    return (int32_t)this->randomNumberGenerator.nextLong();
}

int32_t XoroshiroRandomSource::nextInt(int32_t bound) {
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

int64_t XoroshiroRandomSource::nextLong() {
    return this->randomNumberGenerator.nextLong();
}

bool XoroshiroRandomSource::nextBoolean() {
    return (this->randomNumberGenerator.nextLong() & 1LL) != 0LL;
}

float XoroshiroRandomSource::nextFloat() {
    return (float)this->nextBits(24) * 5.9604645E-8F;
}

double XoroshiroRandomSource::nextDouble() {
    return (double)this->nextBits(53) * (double)1.110223E-16F;
}

double XoroshiroRandomSource::nextGaussian() {
    return this->gaussianSource.nextGaussian();
}

void XoroshiroRandomSource::consumeCount(int32_t count) {
    for (int32_t i = 0; i < count; ++i) {
        this->randomNumberGenerator.nextLong();
    }
}

int64_t XoroshiroRandomSource::nextBits(int32_t bits) {
    return ushr_l(this->randomNumberGenerator.nextLong(), (64 - bits));
}

// XoroshiroPositionalRandomFactory

XoroshiroRandomSource::XoroshiroPositionalRandomFactory::XoroshiroPositionalRandomFactory(int64_t seedLo,
                                                                                          int64_t seedHi)
    : seedLo(seedLo), seedHi(seedHi) {
    objectCreated("PositionalRandomFactory");
}

unique_ptr<RandomSource> XoroshiroRandomSource::XoroshiroPositionalRandomFactory::at(int32_t x, int32_t y, int32_t z) {
    int64_t i = Mth::getSeed(x, y, z);
    int64_t j = i ^ this->seedLo;
    return make_unique<XoroshiroRandomSource>(j, this->seedHi);
}

unique_ptr<RandomSource> XoroshiroRandomSource::XoroshiroPositionalRandomFactory::fromHashOf(string s) {
    MD5_CTX md5;
    BYTE hash[MD5_BLOCK_SIZE];

    md5_init(&md5);
    md5_update(&md5, (const BYTE *)s.c_str(), s.length() * sizeof(char));
    md5_final(&md5, hash);

    int64_t lo = fromBytes(hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7]);
    int64_t hi = fromBytes(hash[8], hash[9], hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]);
    return make_unique<XoroshiroRandomSource>(lo ^ this->seedLo, hi ^ this->seedHi);
}

// BitRandomSource

int32_t BitRandomSource::nextInt() {
    return this->next(32);
}

int32_t BitRandomSource::nextInt(int32_t bound) {
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

int64_t BitRandomSource::nextLong() {
    int32_t i = this->next(32);
    int32_t j = this->next(32);
    int64_t k = (int64_t)i << 32;
    return k + (int64_t)j;
}

bool BitRandomSource::nextBoolean() {
    return this->next(1) != 0;
}

float BitRandomSource::nextFloat() {
    return (float)this->next(24) * FLOAT_MULTIPLIER;
}

double BitRandomSource::nextDouble() {
    int32_t i = this->next(26);
    int32_t j = this->next(27);
    int64_t k = ((int64_t)i << 27) + (int64_t)j;
    return (double)k * DOUBLE_MULTIPLIER;
}

// LegacyRandomSource

LegacyRandomSource::LegacyRandomSource(int64_t seed) {
    this->setSeed(seed);
    objectCreated("RandomSource");
}

unique_ptr<RandomSource> LegacyRandomSource::fork() {
    return make_unique<LegacyRandomSource>(this->nextLong());
}

unique_ptr<PositionalRandomFactory> LegacyRandomSource::forkPositional() {
    return make_unique<LegacyRandomSource::LegacyPositionalRandomFactory>(this->nextLong());
}

void LegacyRandomSource::setSeed(int64_t seed) {
    this->seed = (seed ^ MULTIPLIER) & MODULUS_MASK;
    this->gaussianSource.reset();
}

int32_t LegacyRandomSource::next(int32_t bits) {
    int64_t seed = this->seed;
    int64_t newSeed = seed * MULTIPLIER + INCREMENT & MODULUS_MASK;
    this->seed = newSeed;

    return (int32_t)(newSeed >> (MODULUS_BITS - bits));
}

double LegacyRandomSource::nextGaussian() {
    return this->gaussianSource.nextGaussian();
}

// LegacyPositionalRandomFactory

LegacyRandomSource::LegacyPositionalRandomFactory::LegacyPositionalRandomFactory(int64_t seed) : seed(seed) {
    objectCreated("PositionalRandomFactory");
}

unique_ptr<RandomSource> LegacyRandomSource::LegacyPositionalRandomFactory::at(int32_t x, int32_t y, int32_t z) {
    int64_t seed = Mth::getSeed(x, y, z);
    int64_t newSeed = seed ^ this->seed;
    return make_unique<LegacyRandomSource>(newSeed);
}

unique_ptr<RandomSource> LegacyRandomSource::LegacyPositionalRandomFactory::fromHashOf(string s) {
    int32_t hash = hashCode(s);
    return make_unique<LegacyRandomSource>((int64_t)hash ^ this->seed);
}

// Random

Random::Random(int64_t seed) {
    this->setSeed(seed);
}

unique_ptr<RandomSource> Random::fork() {
    return nullptr;
}

unique_ptr<PositionalRandomFactory> Random::forkPositional() {
    return nullptr;
}

void Random::setSeed(int64_t seed) {
    this->seed = initialScramble(seed);
    this->haveNextNextGaussian = false;
}

int32_t Random::next(int32_t bits) {
    this->seed = (this->seed * multiplier + addend) & mask;
    return (int32_t)(ushr_l(this->seed, (48 - bits)));
}

int32_t Random::nextInt() {
    return next(32);
}

int32_t Random::nextInt(int32_t bound) {
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

int64_t Random::nextLong() {
    // it's okay that the bottom word remains signed.
    return ((int64_t)(next(32)) << 32) + next(32);
}

bool Random::nextBoolean() {
    return next(1) != 0;
}

float Random::nextFloat() {
    return next(24) / ((float)(1 << 24));
}

double Random::nextDouble() {
    return (((int64_t)(next(26)) << 27) + next(27)) * DOUBLE_UNIT;
}

double Random::nextGaussian() {
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

// WorldgenRandom

WorldgenRandom::WorldgenRandom(unique_ptr<RandomSource> randomSource)
    : Random(0LL), randomSource(std::move(randomSource)), count(0) {
    objectCreated("RandomSource");
}

unique_ptr<RandomSource> WorldgenRandom::fork() {
    return this->randomSource->fork();
}

unique_ptr<PositionalRandomFactory> WorldgenRandom::forkPositional() {
    return this->randomSource->forkPositional();
}

void WorldgenRandom::setSeed(int64_t seed) {
    if (this->randomSource != nullptr) {
        this->randomSource->setSeed(seed);
    }
}

int32_t WorldgenRandom::getCount() {
    return this->count;
}

int32_t WorldgenRandom::next(int32_t bits) {
    ++this->count;
    RandomSource *randomsource = this->randomSource.get();
    if (LegacyRandomSource *legacyrandomsource = dynamic_cast<LegacyRandomSource *>(randomsource)) {
        return legacyrandomsource->next(bits);
    } else {
        return (int32_t)(ushr_l(this->randomSource->nextLong(), (64 - bits)));
    }
}

int64_t WorldgenRandom::setDecorationSeed(int64_t seed, int32_t x, int32_t y) {
    this->setSeed(seed);
    int64_t i = this->nextLong() | 1LL;
    int64_t j = this->nextLong() | 1LL;
    int64_t newSeed = (int64_t)x * i + (int64_t)y * j ^ seed;
    this->setSeed(newSeed);
    return newSeed;
}

void WorldgenRandom::setFeatureSeed(int64_t seed, int32_t counter1, int32_t counter2) {
    int64_t newSeed = seed + (int64_t)counter1 + (int64_t)(10000 * counter2);
    this->setSeed(newSeed);
}

void WorldgenRandom::setLargeFeatureSeed(int64_t seed, int32_t x, int32_t y) {
    this->setSeed(seed);
    int64_t i = this->nextLong();
    int64_t j = this->nextLong();
    int64_t newSeed = (int64_t)x * i ^ (int64_t)y * j ^ seed;
    this->setSeed(newSeed);
}

void WorldgenRandom::setLargeFeatureWithSalt(int64_t salt, int32_t x, int32_t y, int32_t z) {
    int64_t seed = (int64_t)x * 341873128712LL + (int64_t)y * 132897987541LL + salt + (int64_t)z;
    this->setSeed(seed);
}

unique_ptr<Random> WorldgenRandom::seedSlimeChunk(int32_t x, int32_t z, int64_t seed, int64_t salt) {
    return make_unique<Random>(seed + (int64_t)(x * x * 4987142) + (int64_t)(x * 5947611) +
                                   (int64_t)(z * z) * 4392871LL + (int64_t)(z * 389711) ^
                               salt);
}

unique_ptr<RandomSource> WorldgenRandom::Algorithm_newInstance(Algorithm algorithm, int64_t seed) {
    if (algorithm == Algorithm::LEGACY) {
        return make_unique<LegacyRandomSource>(seed);
    } else if (algorithm == Algorithm::XOROSHIRO) {
        return make_unique<XoroshiroRandomSource>(seed);
    } else {
        return nullptr;
    }
}