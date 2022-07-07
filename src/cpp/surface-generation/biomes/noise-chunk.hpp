#pragma once

#include "aquifer.hpp"
#include "chunk-generator.fwd.hpp"
#include "chunks.hpp"
#include "mth.hpp"
#include "noise-chunk.fwd.hpp"

#include <map>

using namespace std;

class Sampler {
public:
    virtual double sample() = 0;
};

class ConstantSampler : public Sampler {
private:
    double value;

public:
    ConstantSampler(double value) {
        this->value = value;
    }

    double sample() {
        return this->value;
    }
};

class NoiseChunk;
class NoiseInterpolator;

using InterpolatableNoise = function<Sampler *(NoiseChunk *)>;
using NoiseFiller = function<double(int32_t x, int32_t y, int32_t z)>;
using BlockStateFiller = function<BlockState(int32_t x, int32_t y, int32_t z)>;

template <typename K, typename T> T computeIfAbsent(std::map<K, T> &m, K key, function<T(K)> computor) {
    if (m.find(key) == m.end()) {
        T value = computor(key);
        m.at(key) = value;
        return value;
    } else {
        return m.at(key);
    }
}

class NoiseChunk {
public:
    typedef Sampler Sampler;
    typedef NoiseInterpolator NoiseInterpolator;
    typedef InterpolatableNoise InterpolatableNoise;
    typedef NoiseFiller NoiseFiller;
    typedef BlockStateFiller BlockStateFiller;

public:
    int32_t cellCountXZ;
    int32_t cellCountY;
    int32_t cellNoiseMinY;
    int32_t firstCellX;
    int32_t firstCellZ;
    int32_t firstNoiseX;
    int32_t firstNoiseZ;

    vector<NoiseChunk::NoiseInterpolator *> interpolators;
    NoiseSettings *noiseSettings;

    std::map<int64_t, int32_t> _preliminarySurfaceLevel = std::map<int64_t, int32_t>();

private:
    NoiseSampler *sampler;

    vector<FlatNoiseData **> _noiseData;
    Aquifer *_aquifer;
    NoiseChunk::BlockStateFiller baseNoise;
    NoiseChunk::BlockStateFiller oreVeins;
    Blender *blender;

public:
    static NoiseChunk *forChunk(ChunkAccess *chunkAccess, NoiseSampler *sampler,
                                function<NoiseChunk::NoiseFiller(void)> filler,
                                NoiseGeneratorSettings *generatorSettings, Aquifer::FluidPicker *fluidPicker,
                                Blender *blender);

    static NoiseChunk *forColumn(int32_t startX, int32_t startZ, int32_t cellNoiseMinY, int32_t cellCountY,
                                 NoiseSampler *p_188763_, NoiseGeneratorSettings *noiseSettings,
                                 Aquifer::FluidPicker *fluidPicker);

private:
    NoiseChunk(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY, NoiseSampler *sampler, int32_t startX,
               int32_t startZ, NoiseChunk::NoiseFiller filler, NoiseGeneratorSettings *noiseSettings,
               Aquifer::FluidPicker *fluidPicker, Blender *blender);

public:
    FlatNoiseData *noiseData(int32_t x, int32_t z) {
        return this->_noiseData[x - this->firstNoiseX][z - this->firstNoiseZ];
    }

    int32_t preliminarySurfaceLevel(int32_t x, int32_t z) {
        return computeIfAbsent<int64_t, int32_t>(
            this->_preliminarySurfaceLevel, ChunkPos::asLong(QuartPos::fromBlock(x), QuartPos::fromBlock(z)),
            [this](int64_t loc) -> int32_t { return this->computePreliminarySurfaceLevel(loc); });
    }

private:
    int32_t computePreliminarySurfaceLevel(int64_t p_198250_);

public:
    NoiseChunk::NoiseInterpolator *createNoiseInterpolator(NoiseChunk::NoiseFiller p_188781_);

    Blender *getBlender() {
        return this->blender;
    }

    void initializeForFirstCellX();
    void advanceCellX(int32_t p_188750_);
    void selectCellYZ(int32_t p_188811_, int32_t p_188812_);
    void updateForY(double p_188745_);
    void updateForX(double p_188793_);
    void updateForZ(double p_188806_);
    void swapSlices();

    Aquifer *aquifer() {
        return this->_aquifer;
    }

    BlockState updateNoiseAndGenerateBaseState(int32_t p_188755_, int32_t p_188756_, int32_t p_188757_) {
        return this->baseNoise(p_188755_, p_188756_, p_188757_);
    }

    BlockState oreVeinify(int32_t p_188801_, int32_t p_188802_, int32_t p_188803_) {
        return this->oreVeins(p_188801_, p_188802_, p_188803_);
    }
};

class NoiseInterpolator : public Sampler {
private:
    NoiseChunk *noiseChunk;
    double **slice0;
    double **slice1;
    NoiseFiller noiseFiller;
    double noise000;
    double noise001;
    double noise100;
    double noise101;
    double noise010;
    double noise011;
    double noise110;
    double noise111;
    double valueXZ00;
    double valueXZ10;
    double valueXZ01;
    double valueXZ11;
    double valueZ0;
    double valueZ1;
    double value;

public:
    NoiseInterpolator(NoiseChunk *noiseChunk, NoiseFiller p_188848_) {
        this->noiseChunk = noiseChunk;
        this->noiseFiller = p_188848_;
        this->slice0 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
        this->slice1 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
        this->noiseChunk->interpolators.push_back(this);
    }

private:
    double **allocateSlice(int32_t p_188855_, int32_t p_188856_) {
        int32_t i = p_188856_ + 1;
        int32_t j = p_188855_ + 1;
        double **adouble = new double *[i];

        for (int32_t k = 0; k < i; ++k) {
            adouble[k] = new double[j];
        }

        return adouble;
    }

public:
    void initializeForFirstCellX() {
        this->fillSlice(this->slice0, this->noiseChunk->firstCellX);
    }

    void advanceCellX(int32_t p_188853_) {
        this->fillSlice(this->slice1, this->noiseChunk->firstCellX + p_188853_ + 1);
    }

private:
    void fillSlice(double **p_188858_, int32_t p_188859_);

public:
    void selectCellYZ(int32_t p_188864_, int32_t p_188865_) {
        this->noise000 = this->slice0[p_188865_][p_188864_];
        this->noise001 = this->slice0[p_188865_ + 1][p_188864_];
        this->noise100 = this->slice1[p_188865_][p_188864_];
        this->noise101 = this->slice1[p_188865_ + 1][p_188864_];
        this->noise010 = this->slice0[p_188865_][p_188864_ + 1];
        this->noise011 = this->slice0[p_188865_ + 1][p_188864_ + 1];
        this->noise110 = this->slice1[p_188865_][p_188864_ + 1];
        this->noise111 = this->slice1[p_188865_ + 1][p_188864_ + 1];
    }

    void updateForY(double p_188851_) {
        this->valueXZ00 = Mth::lerp(p_188851_, this->noise000, this->noise010);
        this->valueXZ10 = Mth::lerp(p_188851_, this->noise100, this->noise110);
        this->valueXZ01 = Mth::lerp(p_188851_, this->noise001, this->noise011);
        this->valueXZ11 = Mth::lerp(p_188851_, this->noise101, this->noise111);
    }

    void updateForX(double p_188862_) {
        this->valueZ0 = Mth::lerp(p_188862_, this->valueXZ00, this->valueXZ10);
        this->valueZ1 = Mth::lerp(p_188862_, this->valueXZ01, this->valueXZ11);
    }

    void updateForZ(double p_188867_) {
        this->value = Mth::lerp(p_188867_, this->valueZ0, this->valueZ1);
    }

public:
    double sample() {
        return this->value;
    }

    void swapSlices() {
        double **adouble = this->slice0;
        this->slice0 = this->slice1;
        this->slice1 = adouble;
    }
};