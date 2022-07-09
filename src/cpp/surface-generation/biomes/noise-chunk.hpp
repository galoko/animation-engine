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
                                 NoiseSampler *sampler, NoiseGeneratorSettings *noiseSettings,
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
    int32_t computePreliminarySurfaceLevel(int64_t loc);

public:
    NoiseChunk::NoiseInterpolator *createNoiseInterpolator(NoiseChunk::NoiseFiller filler);

    Blender *getBlender() {
        return this->blender;
    }

    void initializeForFirstCellX();
    void advanceCellX(int32_t cellX);
    void selectCellYZ(int32_t cellY, int32_t cellZ);
    void updateForY(double t);
    void updateForX(double t);
    void updateForZ(double t);
    void swapSlices();

    Aquifer *aquifer() {
        return this->_aquifer;
    }

    BlockState updateNoiseAndGenerateBaseState(int32_t x, int32_t y, int32_t z) {
        return this->baseNoise(x, y, z);
    }

    BlockState oreVeinify(int32_t x, int32_t y, int32_t z) {
        return this->oreVeins(x, y, z);
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
    NoiseInterpolator(NoiseChunk *noiseChunk, NoiseFiller filler) {
        this->noiseChunk = noiseChunk;
        this->noiseFiller = filler;
        this->slice0 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
        this->slice1 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
        this->noiseChunk->interpolators.push_back(this);
    }

private:
    double **allocateSlice(int32_t cellCountY, int32_t cellCountXZ) {
        int32_t sliceWidth = cellCountXZ + 1;
        int32_t sliceHeight = cellCountY + 1;
        double **slice = new double *[sliceWidth];

        for (int32_t x = 0; x < sliceWidth; ++x) {
            slice[x] = new double[sliceHeight];
        }

        return slice;
    }

public:
    void initializeForFirstCellX() {
        this->fillSlice(this->slice0, this->noiseChunk->firstCellX);
    }

    void advanceCellX(int32_t cellX) {
        this->fillSlice(this->slice1, this->noiseChunk->firstCellX + cellX + 1);
    }

private:
    void fillSlice(double **slice, int32_t cellX);

public:
    void selectCellYZ(int32_t cellY, int32_t cellZ) {
        this->noise000 = this->slice0[cellZ][cellY];
        this->noise001 = this->slice0[cellZ + 1][cellY];
        this->noise100 = this->slice1[cellZ][cellY];
        this->noise101 = this->slice1[cellZ + 1][cellY];
        this->noise010 = this->slice0[cellZ][cellY + 1];
        this->noise011 = this->slice0[cellZ + 1][cellY + 1];
        this->noise110 = this->slice1[cellZ][cellY + 1];
        this->noise111 = this->slice1[cellZ + 1][cellY + 1];
    }

    void updateForY(double t) {
        this->valueXZ00 = Mth::lerp(t, this->noise000, this->noise010);
        this->valueXZ10 = Mth::lerp(t, this->noise100, this->noise110);
        this->valueXZ01 = Mth::lerp(t, this->noise001, this->noise011);
        this->valueXZ11 = Mth::lerp(t, this->noise101, this->noise111);
    }

    void updateForX(double t) {
        this->valueZ0 = Mth::lerp(t, this->valueXZ00, this->valueXZ10);
        this->valueZ1 = Mth::lerp(t, this->valueXZ01, this->valueXZ11);
    }

    void updateForZ(double t) {
        this->value = Mth::lerp(t, this->valueZ0, this->valueZ1);
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